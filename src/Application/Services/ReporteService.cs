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
    public class ReporteService
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
            var insumos = await _insumoRepo.GetAllAsync("Categoria", "Ubicacion");

            var criticos = stockGeneral
                .Where(s => s.StockActual <= umbral)
                .Join(insumos, s => s.IdInsumo, i => i.Id, (s, i) => new StockCriticoDto
                {
                    IdInsumo = i.Id,
                    CodigoFabrica = i.CodigoFabrica,
                    Descripcion = i.Descripcion,
                    Categoria = i.Categoria?.Nombre ?? "",
                    Ubicacion = i.Ubicacion?.Nombre ?? "",
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
                .Select(m => new MovimientoDto
                {
                    Id = m.Id,
                    IdInsumo = m.IdInsumo,
                    CodigoFabrica = m.Insumo?.CodigoFabrica ?? "",
                    TipoMovimiento = m.TipoMovimiento switch
                    {
                        TipoMovimiento.Ingreso => "INGRESO",
                        TipoMovimiento.Salida => "SALIDA",
                        TipoMovimiento.Ajuste => "AJUSTE",
                        _ => "?"
                    },
                    Cantidad = m.Cantidad,
                    Fecha = m.Fecha,
                    PrecioUnitario = m.PrecioUnitario,
                    Observacion = m.Observacion,
                    ProveedorNombre = m.Proveedor?.Nombre,
                    TipoCompraNombre = m.TipoCompra?.Nombre,
                    ProyectoNombre = m.Proyecto?.Nombre,
                    EstadoSalidaNombre = m.EstadoSalida?.Nombre
                })
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

            // Obtener totales paralelamente
            var taskInsumos = _insumoRepo.GetAllAsync();
            var taskProyectos = _proyectoRepo.GetAllAsync();
            var taskProveedores = _proveedorRepo.GetAllAsync();
            var taskStockBajo = GetStockCriticoAsync(10);
            var taskUltimosMovs = _movRepo.FindAsync(_ => true, "Insumo");
            var taskMovsHoy = _movRepo.FindAsync(m => m.Fecha >= hoy);
            var taskMovsMes = _movRepo.FindAsync(m => m.Fecha >= inicioMes);

            await Task.WhenAll(taskInsumos, taskProyectos, taskProveedores,
                taskStockBajo, taskUltimosMovs, taskMovsHoy, taskMovsMes);

            var insumos = taskInsumos.Result.ToList();
            var proyectos = taskProyectos.Result.ToList();
            var proveedores = taskProveedores.Result.ToList();
            var ultimosMovs = taskUltimosMovs.Result
                .OrderByDescending(m => m.Fecha)
                .Take(10)
                .Select(m => new MovimientoDto
                {
                    Id = m.Id,
                    IdInsumo = m.IdInsumo,
                    CodigoFabrica = m.Insumo?.CodigoFabrica ?? "",
                    TipoMovimiento = m.TipoMovimiento.ToString().ToUpper(),
                    Cantidad = m.Cantidad,
                    Fecha = m.Fecha
                })
                .ToList();

            var movsHoy = taskMovsHoy.Result.ToList();
            var movsMes = taskMovsMes.Result.ToList();
            var stockBajoResult = taskStockBajo.Result;

            var dashboard = new DashboardDto
            {
                TotalInsumos = insumos.Count,
                TotalProyectos = proyectos.Count,
                TotalProveedores = proveedores.Count,
                TotalMovimientos = ultimosMovs.Count,
                MovimientosHoy = movsHoy.Count,
                MovimientosEsteMes = movsMes.Count,
                IngresosHoy = movsHoy.Count(m => m.TipoMovimiento == TipoMovimiento.Ingreso),
                SalidasHoy = movsHoy.Count(m => m.TipoMovimiento == TipoMovimiento.Salida),
                StockBajoCount = stockBajoResult.Data?.Count ?? 0,
                StockBajo = stockBajoResult.Data ?? new(),
                UltimosMovimientos = ultimosMovs
            };

            return OperationResult<DashboardDto>.Ok(dashboard);
        }
    }
}
