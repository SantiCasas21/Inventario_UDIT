using Application.Common.Interfaces;
using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Domain.Entities.Catalogos;
using Domain.Enums;

namespace Application.Services
{
    /// <summary>
    /// Servicio de reportes para el inventario.
    /// Aquí se concentran las consultas analíticas
    /// que combinan datos de múltiples tablas.
    /// </summary>
    public class ReporteService : IReporteService
    {
        private readonly IMovimientoRepository _movRepo;
        private readonly IBaseRepository<Insumo> _insumoRepo;
        private readonly IBaseRepository<Proyecto> _proyectoRepo;
        private readonly IBaseRepository<Proveedor> _proveedorRepo;

        public ReporteService(
            IMovimientoRepository movRepo,
            IBaseRepository<Insumo> insumoRepo,
            IBaseRepository<Proyecto> proyectoRepo,
            IBaseRepository<Proveedor> proveedorRepo)
        {
            _movRepo = movRepo;
            _insumoRepo = insumoRepo;
            _proyectoRepo = proyectoRepo;
            _proveedorRepo = proveedorRepo;
        }

        // ==========================================
        // REPORTE 1: KARDEX DETALLADO + SALDO ACUMULADO
        // ==========================================
        // Muestra cada movimiento de un insumo y calcula
        // el saldo DESPUÉS de cada transacción.
        //
        // Ej:   Fecha     | Tipo   | Cant | Saldo
        //       01-01     | INGR   |  100 |  100
        //       02-01     | SAL    |  -30 |   70
        //       03-01     | INGR   |   50 |  120
        // ==========================================
        public async Task<OperationResult<List<KardexDetalladoDto>>> GetKardexDetalladoAsync(
            int insumoId, DateTime? desde = null, DateTime? hasta = null)
        {
            var insumo = await _insumoRepo.GetByIdAsync(insumoId);
            if (insumo == null)
                return OperationResult<List<KardexDetalladoDto>>.Fail("Insumo no encontrado");

            // Obtener movimientos ordenados por fecha
            var movimientos = await _movRepo.FindAsync(
                m => m.IdInsumo == insumoId
                    && (!desde.HasValue || m.Fecha >= desde.Value)
                    && (!hasta.HasValue || m.Fecha <= hasta.Value),
                "Proveedor", "Proyecto");

            var ordenados = movimientos.OrderBy(m => m.Fecha).ThenBy(m => m.Id);

            // Recorrer los movimientos calculando saldo acumulado
            var saldo = 0;
            var kardex = new List<KardexDetalladoDto>();

            foreach (var m in ordenados)
            {
                switch (m.TipoMovimiento)
                {
                    case TipoMovimiento.Ingreso:
                        saldo += m.Cantidad;
                        break;
                    case TipoMovimiento.Salida:
                        saldo -= m.Cantidad;
                        break;
                    case TipoMovimiento.Ajuste:
                        saldo += m.Cantidad; // el signo se maneja al registrar
                        break;
                }

                kardex.Add(new KardexDetalladoDto
                {
                    IdMovimiento = m.Id,
                    Fecha = m.Fecha,
                    TipoMovimiento = m.TipoMovimiento switch
                    {
                        TipoMovimiento.Ingreso => "INGRESO",
                        TipoMovimiento.Salida => "SALIDA",
                        TipoMovimiento.Ajuste => "AJUSTE",
                        _ => "?"
                    },
                    Cantidad = m.Cantidad,
                    Observacion = m.Observacion,
                    Proveedor = m.Proveedor?.Nombre,
                    Proyecto = m.Proyecto?.Nombre,
                    SaldoAcumulado = saldo
                });
            }

            return OperationResult<List<KardexDetalladoDto>>.Ok(kardex);
        }

        // ==========================================
        // REPORTE 2: STOCK CRÍTICO
        // ==========================================
        // Insumos cuyo stock actual está por debajo
        // de un umbral definido.
        // ==========================================
        public async Task<OperationResult<List<StockCriticoDto>>> GetStockCriticoAsync(
            int umbral = 10)
        {
            var stockGeneral = await _movRepo.GetStockGeneralDbAsync();
            var insumos = await _insumoRepo.GetAllAsync("Categoria");

            var criticos = stockGeneral
                .Where(s => s.StockActual <= umbral)
                .Join(insumos, s => s.IdInsumo, i => i.Id, (s, i) => new StockCriticoDto
                {
                    IdInsumo = i.Id,
                    CodigoFabrica = i.CodigoFabrica,
                    Descripcion = i.Descripcion,
                    Categoria = i.Categoria?.Nombre ?? "",
                    Ubicacion = "Múltiples",
                    StockActual = s.StockActual,
                    Umbral = umbral
                })
                .OrderBy(c => c.StockActual)
                .ToList();

            return OperationResult<List<StockCriticoDto>>.Ok(criticos);
        }

        // ==========================================
        // REPORTE 3: MOVIMIENTOS POR PERÍODO
        // ==========================================
        // Filtra movimientos por rango de fechas
        // y devuelve estadísticas agregadas.
        // ==========================================
        public async Task<OperationResult<MovimientosPeriodoDto>> GetMovimientosPorPeriodoAsync(
            DateTime desde, DateTime hasta, int? insumoId = null)
        {
            // Construir filtro
            var movimientos = await _movRepo.FindAsync(
                m => m.Fecha >= desde
                    && m.Fecha <= hasta
                    && (!insumoId.HasValue || m.IdInsumo == insumoId.Value),
                "Insumo", "Proveedor", "TipoCompra", "Proyecto", "EstadoSalida");

            var dtos = movimientos
                .OrderByDescending(m => m.Fecha)
                .Select(MovimientoDto.FromEntity)
                .ToList();

            var reporte = new MovimientosPeriodoDto
            {
                TotalIngresos = dtos.Count(d => d.TipoMovimiento == "INGRESO"),
                TotalSalidas = dtos.Count(d => d.TipoMovimiento == "SALIDA"),
                TotalAjustes = dtos.Count(d => d.TipoMovimiento == "AJUSTE"),
                CantidadIngresada = dtos.Where(d => d.TipoMovimiento == "INGRESO").Sum(d => d.Cantidad),
                CantidadSalida = dtos.Where(d => d.TipoMovimiento == "SALIDA").Sum(d => d.Cantidad),
                Movimientos = dtos
            };

            return OperationResult<MovimientosPeriodoDto>.Ok(reporte);
        }

        // ==========================================
        // REPORTE 4: RESUMEN POR PROYECTO
        // ==========================================
        // Muestra qué insumos se retiraron para un
        // proyecto y en qué cantidades.
        // ==========================================
        public async Task<OperationResult<List<ResumenProyectoDto>>> GetResumenPorProyectoAsync(
            int? proyectoId = null)
        {
            // Traer todas las salidas agrupadas por proyecto
            var movimientos = await _movRepo.FindAsync(
                m => m.TipoMovimiento == TipoMovimiento.Salida
                    && (!proyectoId.HasValue || m.IdProyecto == proyectoId.Value),
                "Insumo", "Proyecto");

            var agrupado = movimientos
                .GroupBy(m => m.IdProyecto)
                .Select(g =>
                {
                    var proyecto = g.First().Proyecto;
                    return new ResumenProyectoDto
                    {
                        IdProyecto = g.Key ?? 0,
                        ProyectoNombre = proyecto?.Nombre ?? "Sin proyecto",
                        TotalMovimientos = g.Count(),
                        TotalUnidadesRetiradas = g.Sum(m => m.Cantidad),
                        Insumos = g.GroupBy(m => m.IdInsumo).Select(ig => new InsumoResumenDto
                        {
                            IdInsumo = ig.Key,
                            CodigoFabrica = ig.First().Insumo?.CodigoFabrica ?? "",
                            CantidadRetirada = ig.Sum(m => m.Cantidad)
                        }).OrderByDescending(i => i.CantidadRetirada).ToList()
                    };
                })
                .OrderByDescending(r => r.TotalUnidadesRetiradas)
                .ToList();

            return OperationResult<List<ResumenProyectoDto>>.Ok(agrupado);
        }

        // ==========================================
        // DASHBOARD: Métricas clave en una sola llamada
        // ==========================================
        public async Task<OperationResult<DashboardDto>> GetDashboardAsync()
        {
            var hoy = DateTime.UtcNow.Date;
            var inicioMes = new DateTime(hoy.Year, hoy.Month, 1);

            // Ejecutar secuencialmente — DbContext NO es thread-safe.
            // Las queries son rápidas (COUNTs y pequeños SELECTs), el overhead
            // de secuencialidad es mínimo comparado con la estabilidad que gana.
            var insumos = (await _insumoRepo.GetAllAsync()).ToList();
            var proyectos = (await _proyectoRepo.GetAllAsync()).ToList();
            var proveedores = (await _proveedorRepo.GetAllAsync()).ToList();
            var stockBajoResult = await GetStockCriticoAsync(10);

            // Obtener stock general para enriquecer datos de irregularidades
            var stockGeneral = await _movRepo.GetStockGeneralDbAsync();
            var stockDict = stockGeneral.ToDictionary(s => s.IdInsumo);

            // Solo los últimos 10 movimientos (con paginación en BD, no en memoria)
            var ultimosMovsPaged = await _movRepo.FilterPagedAsync(new MovimientoFilterDto
            {
                SortBy = "fecha",
                SortDescending = true,
                Page = 1,
                PageSize = 10
            });

            var movsHoy = (await _movRepo.FindAsync(m => m.Fecha >= hoy)).ToList();
            var movsMes = (await _movRepo.FindAsync(m => m.Fecha >= inicioMes)).ToList();

            var ultimosMovs = ultimosMovsPaged.Items.Select(MovimientoDto.FromEntity).ToList();

            // ==========================================
            // Detección de Irregularidades
            // ==========================================
            var irregularidades = new List<IrregularidadDto>();

            // 1. Duplicados por CódigoFábrica
            var duplicados = insumos
                .GroupBy(i => i.CodigoFabrica)
                .Where(g => g.Count() > 1)
                .ToList();

            foreach (var grupo in duplicados)
            {
                var ids = string.Join(", ", grupo.Select(i => i.Id));
                irregularidades.Add(new IrregularidadDto
                {
                    Tipo = "duplicado",
                    Descripcion = $"Código de fábrica '{grupo.Key}' aparece {grupo.Count()} veces (IDs: {ids})",
                    InsumoRef = grupo.Key,
                    Severidad = "alta",
                    Detalles = grupo.Select(i => new InsumoIrregularidadDto
                    {
                        Id = i.Id,
                        CodigoFabrica = i.CodigoFabrica,
                        Stock = stockDict.GetValueOrDefault(i.Id)?.StockActual ?? 0,
                        Ubicacion = "Varias"
                    }).ToList()
                });
            }

            // 1.5 Insumos Unificados (Resueltos)
            var movsUnificacion = await _movRepo.FindAsync(m => m.TipoMovimiento == Domain.Enums.TipoMovimiento.Unificacion);
            var unifiedIds = movsUnificacion.Select(m => m.IdInsumo).Distinct().ToHashSet();

            foreach (var insumo in insumos.Where(i => unifiedIds.Contains(i.Id)))
            {
                var stocksPorUbi = await _movRepo.GetStockPorUbicacionAsync(insumo.Id);
                var detalles = stocksPorUbi != null && stocksPorUbi.Any() 
                    ? stocksPorUbi.Select(u => new InsumoIrregularidadDto
                    {
                        Id = insumo.Id,
                        CodigoFabrica = insumo.CodigoFabrica,
                        Stock = u.Stock,
                        Ubicacion = u.UbicacionNombre
                    }).ToList()
                    : new List<InsumoIrregularidadDto> 
                    { 
                        new InsumoIrregularidadDto 
                        { 
                            Id = insumo.Id, 
                            CodigoFabrica = insumo.CodigoFabrica, 
                            Stock = 0, 
                            Ubicacion = "Sin stock" 
                        } 
                    };

                irregularidades.Add(new IrregularidadDto
                {
                    Tipo = "resuelto",
                    Descripcion = $"Insumo '{insumo.CodigoFabrica}' (ID: {insumo.Id}) fue unificado exitosamente.",
                    InsumoRef = insumo.CodigoFabrica,
                    Severidad = "baja",
                    Detalles = detalles
                });
            }

            // 2. Sin descripción
            foreach (var insumo in insumos.Where(i => string.IsNullOrWhiteSpace(i.Descripcion)))
            {
                irregularidades.Add(new IrregularidadDto
                {
                    Tipo = "sin_descripcion",
                    Descripcion = $"Insumo '{insumo.CodigoFabrica}' no tiene descripción",
                    InsumoRef = insumo.CodigoFabrica,
                    Severidad = "media",
                    Detalles = new List<InsumoIrregularidadDto>
                    {
                        new() { Id = insumo.Id, CodigoFabrica = insumo.CodigoFabrica,
                                Stock = stockDict.GetValueOrDefault(insumo.Id)?.StockActual ?? 0,
                                Ubicacion = "Varias" }
                    }
                });
            }

            // 3. Precio cero o nulo
            foreach (var insumo in insumos.Where(i => i.PrecioReferencia == null || i.PrecioReferencia == 0))
            {
                irregularidades.Add(new IrregularidadDto
                {
                    Tipo = "precio_cero",
                    Descripcion = $"Insumo '{insumo.CodigoFabrica}' tiene precio {insumo.PrecioReferencia?.ToString() ?? "sin definir"}",
                    InsumoRef = insumo.CodigoFabrica,
                    Severidad = "media",
                    Detalles = new List<InsumoIrregularidadDto>
                    {
                        new() { Id = insumo.Id, CodigoFabrica = insumo.CodigoFabrica,
                                Stock = stockDict.GetValueOrDefault(insumo.Id)?.StockActual ?? 0,
                                Ubicacion = "Varias" }
                    }
                });
            }

            // 4. Stock negativo (consultar stock general)
            try
            {
                var stocksNegativos = stockGeneral.Where(s => s.StockActual < 0).ToList();
                foreach (var st in stocksNegativos)
                {
                    var insumoNeg = insumos.FirstOrDefault(i => i.Id == st.IdInsumo);
                    irregularidades.Add(new IrregularidadDto
                    {
                        Tipo = "stock_negativo",
                        Descripcion = $"Insumo '{insumoNeg?.CodigoFabrica ?? "ID " + st.IdInsumo}' tiene stock negativo: {st.StockActual}",
                        InsumoRef = st.IdInsumo.ToString(),
                        Severidad = "alta",
                        Detalles = new List<InsumoIrregularidadDto>
                        {
                            new() { Id = st.IdInsumo, CodigoFabrica = insumoNeg?.CodigoFabrica ?? "",
                                    Stock = st.StockActual,
                                    Ubicacion = "Varias" }
                        }
                    });
                }
            }
            catch
            {
                // Si falla la consulta de stock, continuamos sin ella
            }

            // Limitar a máximo 15 irregularidades para no saturar el dashboard
            var irregularidadesLimitadas = irregularidades.Take(15).ToList();

            var dashboard = new DashboardDto
            {
                TotalInsumos = insumos.Count,
                TotalProyectos = proyectos.Count,
                TotalProveedores = proveedores.Count,
                TotalMovimientos = ultimosMovsPaged.TotalCount,
                MovimientosHoy = movsHoy.Count,
                MovimientosEsteMes = movsMes.Count,
                IngresosHoy = movsHoy.Count(m => m.TipoMovimiento == Domain.Enums.TipoMovimiento.Ingreso),
                SalidasHoy = movsHoy.Count(m => m.TipoMovimiento == Domain.Enums.TipoMovimiento.Salida),
                StockBajoCount = stockBajoResult.Data?.Count ?? 0,
                StockBajo = stockBajoResult.Data ?? new(),
                UltimosMovimientos = ultimosMovs,
                Irregularidades = irregularidadesLimitadas
            };

            return OperationResult<DashboardDto>.Ok(dashboard);
        }
    }
}
