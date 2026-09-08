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
        // ==========================================
        public async Task<OperationResult<List<KardexDetalladoDto>>> GetKardexDetalladoAsync(
            int insumoId, DateTime? desde = null, DateTime? hasta = null)
        {
            var insumo = await _insumoRepo.GetByIdAsync(insumoId);
            if (insumo == null)
                return OperationResult<List<KardexDetalladoDto>>.Fail("Insumo no encontrado");

            var fechaDesde = desde?.Date;
            var fechaHasta = hasta?.Date.AddDays(1).AddTicks(-1);

            // Obtener movimientos ordenados por fecha
            var movimientos = await _movRepo.FindAsync(
                m => m.IdInsumo == insumoId
                    && (!fechaDesde.HasValue || m.Fecha >= fechaDesde.Value)
                    && (!fechaHasta.HasValue || m.Fecha <= fechaHasta.Value),
                "Proveedor", "Proyecto", "Ubicacion");

            var ordenados = movimientos.OrderBy(m => m.Fecha).ThenBy(m => m.Id);

            // Obtener ubicación actual del insumo como fallback
            var insumoUbis = await _movRepo.GetStockPorUbicacionPorInsumosAsync(new[] { insumoId });
            var fallbackUbicacion = insumoUbis.GetValueOrDefault(insumoId)?.FirstOrDefault()?.UbicacionNombre;

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
                    case TipoMovimiento.Unificacion:
                        saldo += m.Cantidad; // el signo se maneja al registrar (+ o -)
                        break;
                    case TipoMovimiento.Traslado:
                        // Traslado es reubicación física, no altera el stock total
                        break;
                }

                var ubicacionFinal = m.Ubicacion?.Nombre;
                if (string.IsNullOrWhiteSpace(ubicacionFinal))
                {
                    ubicacionFinal = m.UbicacionAnterior?.Nombre ?? fallbackUbicacion ?? "Almacén General";
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
                        TipoMovimiento.Traslado => "TRASLADO",
                        TipoMovimiento.Unificacion => "UNIFICACION",
                        _ => m.TipoMovimiento.ToString().ToUpper()
                    },
                    Cantidad = m.Cantidad,
                    Observacion = m.Observacion,
                    Proveedor = m.Proveedor?.Nombre,
                    Proyecto = m.Proyecto?.Nombre,
                    Ubicacion = ubicacionFinal,
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
            return await CalcularStockCriticoInternalAsync(stockGeneral, umbral);
        }

        private async Task<OperationResult<List<StockCriticoDto>>> CalcularStockCriticoInternalAsync(
            List<StockDbResult> stockGeneral, int umbral)
        {
            var insumos = await _insumoRepo.GetAllAsync("Categoria");

            var criticosInsumos = stockGeneral
                .Where(s => s.StockActual <= umbral)
                .Join(insumos, s => s.IdInsumo, i => i.Id, (s, i) => new { Insumo = i, Stock = s.StockActual })
                .ToList();

            var insumoIds = criticosInsumos.Select(c => c.Insumo.Id).ToArray();
            var ubicacionesPorInsumo = await _movRepo.GetStockPorUbicacionPorInsumosAsync(insumoIds);

            var criticos = criticosInsumos.Select(c =>
            {
                var ubis = ubicacionesPorInsumo.GetValueOrDefault(c.Insumo.Id);
                string ubicacionStr;
                if (ubis == null || ubis.Count == 0)
                {
                    ubicacionStr = c.Stock <= 0 ? "Agotado (Sin ubicación)" : "Sin ubicación asignada";
                }
                else if (ubis.Count == 1)
                {
                    ubicacionStr = ubis[0].UbicacionNombre;
                }
                else
                {
                    ubicacionStr = string.Join(", ", ubis.Select(u => $"{u.UbicacionNombre} ({u.Stock})"));
                }

                return new StockCriticoDto
                {
                    IdInsumo = c.Insumo.Id,
                    CodigoFabrica = c.Insumo.CodigoFabrica,
                    Descripcion = c.Insumo.Descripcion,
                    Categoria = c.Insumo.Categoria?.Nombre ?? "",
                    Ubicacion = ubicacionStr,
                    StockActual = c.Stock,
                    Umbral = umbral
                };
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
            var fechaDesde = desde.Date;
            var fechaHasta = hasta.Date.AddDays(1).AddTicks(-1);

            // Construir filtro
            var movimientos = await _movRepo.FindAsync(
                m => m.Fecha >= fechaDesde
                    && m.Fecha <= fechaHasta
                    && (!insumoId.HasValue || m.IdInsumo == insumoId.Value),
                "Insumo", "Proveedor", "TipoCompra", "Proyecto", "EstadoSalida", "Ubicacion");

            var dtos = movimientos
                .OrderByDescending(m => m.Fecha)
                .Select(MovimientoDto.FromEntity)
                .ToList();

            var reporte = new MovimientosPeriodoDto
            {
                TotalIngresos = dtos.Count(d => d.TipoMovimiento == "INGRESO"),
                TotalSalidas = dtos.Count(d => d.TipoMovimiento == "SALIDA"),
                TotalAjustes = dtos.Count(d => d.TipoMovimiento == "AJUSTE" || d.TipoMovimiento == "TRASLADO" || d.TipoMovimiento == "UNIFICACION"),
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
        // proyecto, en qué cantidades y el valor económico invertido.
        // ==========================================
        public async Task<OperationResult<List<ResumenProyectoDto>>> GetResumenPorProyectoAsync(
            int? proyectoId = null)
        {
            // Traer todas las salidas agrupadas por proyecto con sus relaciones
            var movimientos = await _movRepo.FindAsync(
                m => m.TipoMovimiento == TipoMovimiento.Salida
                    && (!proyectoId.HasValue || m.IdProyecto == proyectoId.Value),
                "Insumo", "Proyecto", "Proyecto.Estado");

            var agrupado = movimientos
                .GroupBy(m => m.IdProyecto)
                .Select(g =>
                {
                    var proyecto = g.First().Proyecto;
                    var estadoNombre = proyecto?.Estado?.Estado ?? "Sin estado";
                    var esCostoFijo = estadoNombre.Contains("Finaliz", StringComparison.OrdinalIgnoreCase)
                                     || estadoNombre.Contains("Suspend", StringComparison.OrdinalIgnoreCase)
                                     || estadoNombre.Contains("Pausa", StringComparison.OrdinalIgnoreCase)
                                     || estadoNombre.Contains("Cancel", StringComparison.OrdinalIgnoreCase);

                    var insumosAgrupados = g.GroupBy(m => m.IdInsumo).Select(ig =>
                    {
                        var insumo = ig.First().Insumo;
                        var cantTotal = ig.Sum(m => m.Cantidad);
                        var costoTotalInsumo = ig.Sum(m =>
                        {
                            var unitPrice = (m.PrecioUnitario.HasValue && m.PrecioUnitario.Value > 0)
                                ? m.PrecioUnitario.Value
                                : (m.Insumo?.PrecioReferencia ?? insumo?.PrecioReferencia ?? 0m);
                            return m.Cantidad * unitPrice;
                        });
                        var precioPromedio = cantTotal > 0 ? Math.Round(costoTotalInsumo / cantTotal, 2) : 0m;

                        return new InsumoResumenDto
                        {
                            IdInsumo = ig.Key,
                            CodigoFabrica = insumo?.CodigoFabrica ?? "",
                            Descripcion = insumo?.Descripcion,
                            CantidadRetirada = cantTotal,
                            PrecioUnitarioPromedio = precioPromedio,
                            CostoTotal = Math.Round(costoTotalInsumo, 2)
                        };
                    }).OrderByDescending(i => i.CantidadRetirada).ToList();

                    var costoTotalProyecto = insumosAgrupados.Sum(i => i.CostoTotal);

                    return new ResumenProyectoDto
                    {
                        IdProyecto = g.Key ?? 0,
                        ProyectoNombre = proyecto?.Nombre ?? "Sin proyecto asignado",
                        EstadoNombre = estadoNombre,
                        EsCostoFijo = esCostoFijo,
                        TotalMovimientos = g.Count(),
                        TotalUnidadesRetiradas = g.Sum(m => m.Cantidad),
                        CostoTotalProyecto = Math.Round(costoTotalProyecto, 2),
                        Moneda = "COP",
                        Insumos = insumosAgrupados
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

            // Obtener stock general UNA sola vez para enriquecer datos de irregularidades y stock crítico
            var stockGeneral = await _movRepo.GetStockGeneralDbAsync();
            var stockDict = stockGeneral.ToDictionary(s => s.IdInsumo);

            // Reutilizar stockGeneral ya cargado en vez de volver a consultar la BD
            var stockBajoResult = await CalcularStockCriticoInternalAsync(stockGeneral, 10);

            // Solo los últimos 10 movimientos (con paginación en BD, no en memoria)
            var ultimosMovsPaged = await _movRepo.FilterPagedAsync(new MovimientoFilterDto
            {
                SortBy = "fecha",
                SortDescending = true,
                Page = 1,
                PageSize = 10
            });

            // P-05: Usar CountAsync en SQL en lugar de FindAsync + .Count() en memoria
            // Esto evita cargar miles de movimientos solo para contar 4 números
            var movimientosHoyCount = await _movRepo.CountAsync(m => m.Fecha >= hoy);
            var movimientosMesCount = await _movRepo.CountAsync(m => m.Fecha >= inicioMes);
            var ingresosHoyCount = await _movRepo.CountAsync(m => m.Fecha >= hoy && m.TipoMovimiento == Domain.Enums.TipoMovimiento.Ingreso);
            var salidasHoyCount = await _movRepo.CountAsync(m => m.Fecha >= hoy && m.TipoMovimiento == Domain.Enums.TipoMovimiento.Salida);

            var ultimosMovs = ultimosMovsPaged.Items.Select(MovimientoDto.FromEntity).ToList();

            // ==========================================
            // Detección de Irregularidades
            // ==========================================
            var irregularidades = new List<IrregularidadDto>();

            // Cargar desglose de stock por ubicación física para todos los insumos de forma agregada
            var allInsumoIds = insumos.Select(i => i.Id).ToArray();
            var ubicacionesPorInsumo = await _movRepo.GetStockPorUbicacionPorInsumosAsync(allInsumoIds);

            string FormatearUbicacion(int insumoId)
            {
                var ubis = ubicacionesPorInsumo.GetValueOrDefault(insumoId);
                if (ubis == null || ubis.Count == 0)
                    return "Sin ubicación";
                return string.Join(", ", ubis.Select(u => ubis.Count > 1 ? $"{u.UbicacionNombre} ({u.Stock})" : u.UbicacionNombre));
            }

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
                        Ubicacion = FormatearUbicacion(i.Id)
                    }).ToList()
                });
            }

            // 1.5 Insumos Unificados (Resueltos)
            var movsUnificacion = await _movRepo.FindAsync(m => m.TipoMovimiento == Domain.Enums.TipoMovimiento.Unificacion);
            var unifiedIds = movsUnificacion.Select(m => m.IdInsumo).Distinct().ToHashSet();

            foreach (var insumo in insumos.Where(i => unifiedIds.Contains(i.Id)))
            {
                var ubis = ubicacionesPorInsumo.GetValueOrDefault(insumo.Id);
                var detalles = ubis != null && ubis.Any() 
                    ? ubis.Select(u => new InsumoIrregularidadDto
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
                                Ubicacion = FormatearUbicacion(insumo.Id) }
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
                                Ubicacion = FormatearUbicacion(insumo.Id) }
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
                                    Ubicacion = FormatearUbicacion(st.IdInsumo) }
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
                MovimientosHoy = movimientosHoyCount,
                MovimientosEsteMes = movimientosMesCount,
                IngresosHoy = ingresosHoyCount,
                SalidasHoy = salidasHoyCount,
                StockBajoCount = stockBajoResult.Data?.Count ?? 0,
                StockBajo = stockBajoResult.Data ?? new(),
                UltimosMovimientos = ultimosMovs,
                Irregularidades = irregularidadesLimitadas
            };

            return OperationResult<DashboardDto>.Ok(dashboard);
        }
    }
}
