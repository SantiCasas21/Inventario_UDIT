using Application.Common.Interfaces;
using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;

namespace Application.Services
{
    /// <summary>
    /// Servicio del Kardex — el cerebro del inventario.
    ///
    /// Aquí NO hay una columna "Stock" en la BD.
    /// El stock se CALCULA en tiempo real sumando Ingresos
    /// y restando Salidas de los movimientos.
    ///
    /// Fórmula: Stock = SUM(Ingresos) - SUM(Salidas)
    /// </summary>
    public class KardexService : IKardexService
    {
        private readonly IMovimientoRepository _movRepo;
        private readonly IBaseRepository<Insumo> _insumoRepo;

        public KardexService(
            IMovimientoRepository movRepo,
            IBaseRepository<Insumo> insumoRepo)
        {
            _movRepo = movRepo;
            _insumoRepo = insumoRepo;
        }

        // ==========================================
        // REGISTRAR INGRESO
        // ==========================================
        public async Task<OperationResult<MovimientoDto>> RegistrarIngresoAsync(MovimientoRequestDto request)
        {
            // Validar que el insumo existe
            if (!await _insumoRepo.ExistsAsync(request.IdInsumo))
                return OperationResult<MovimientoDto>.Fail("El insumo especificado no existe");

            if (request.Cantidad <= 0)
                return OperationResult<MovimientoDto>.Fail("La cantidad debe ser mayor a 0");

            var movimiento = new MovimientoInventario
            {
                IdInsumo = request.IdInsumo,
                TipoMovimiento = TipoMovimiento.Ingreso,
                Cantidad = request.Cantidad,
                Fecha = DateTime.UtcNow,
                PrecioUnitario = request.PrecioUnitario,
                Observacion = request.Observacion,
                IdProveedor = request.IdProveedor,
                IdTipoCompra = request.IdTipoCompra
            };

            var created = await _movRepo.AddAsync(movimiento);
            var dto = await MapToDtoAsync(created);

            return OperationResult<MovimientoDto>.Ok(dto, "Ingreso registrado exitosamente");
        }

        // ==========================================
        // REGISTRAR SALIDA
        // ==========================================
        public async Task<OperationResult<MovimientoDto>> RegistrarSalidaAsync(MovimientoRequestDto request)
        {
            if (!await _insumoRepo.ExistsAsync(request.IdInsumo))
                return OperationResult<MovimientoDto>.Fail("El insumo especificado no existe");

            if (request.Cantidad <= 0)
                return OperationResult<MovimientoDto>.Fail("La cantidad debe ser mayor a 0");

            // Validar stock suficiente
            var stockActual = await CalcularStockAsync(request.IdInsumo);
            if (stockActual < request.Cantidad)
                return OperationResult<MovimientoDto>.Fail(
                    $"Stock insuficiente. Disponible: {stockActual}, solicitado: {request.Cantidad}");

            if (request.IdProyecto == null)
                return OperationResult<MovimientoDto>.Fail("Una salida debe estar asociada a un proyecto");

            if (request.IdEstadoSalida == null)
                return OperationResult<MovimientoDto>.Fail("Una salida debe tener un estado asignado");

            var movimiento = new MovimientoInventario
            {
                IdInsumo = request.IdInsumo,
                TipoMovimiento = TipoMovimiento.Salida,
                Cantidad = request.Cantidad,
                Fecha = DateTime.UtcNow,
                Observacion = request.Observacion,
                IdProyecto = request.IdProyecto,
                IdEstadoSalida = request.IdEstadoSalida
            };

            var created = await _movRepo.AddAsync(movimiento);
            var dto = await MapToDtoAsync(created);

            return OperationResult<MovimientoDto>.Ok(dto, "Salida registrada exitosamente");
        }

        // ==========================================
        // REGISTRAR AJUSTE
        // ==========================================
        public async Task<OperationResult<MovimientoDto>> RegistrarAjusteAsync(MovimientoRequestDto request)
        {
            if (!await _insumoRepo.ExistsAsync(request.IdInsumo))
                return OperationResult<MovimientoDto>.Fail("El insumo especificado no existe");

            if (request.Cantidad == 0)
                return OperationResult<MovimientoDto>.Fail("La cantidad del ajuste no puede ser 0");

            if (string.IsNullOrWhiteSpace(request.Observacion))
                return OperationResult<MovimientoDto>.Fail("Un ajuste requiere una observación");

            // Si la cantidad es negativa, verificar stock suficiente
            if (request.Cantidad < 0)
            {
                var stockActual = await CalcularStockAsync(request.IdInsumo);
                var cantidadAjuste = Math.Abs(request.Cantidad);
                if (stockActual < cantidadAjuste)
                    return OperationResult<MovimientoDto>.Fail(
                        $"Stock insuficiente para el ajuste. Disponible: {stockActual}");
            }

            var movimiento = new MovimientoInventario
            {
                IdInsumo = request.IdInsumo,
                TipoMovimiento = TipoMovimiento.Ajuste,
                Cantidad = request.Cantidad, // negativo = reduce stock, positivo = aumenta
                Fecha = DateTime.UtcNow,
                Observacion = request.Observacion
            };

            var created = await _movRepo.AddAsync(movimiento);
            var dto = await MapToDtoAsync(created);

            return OperationResult<MovimientoDto>.Ok(dto, "Ajuste registrado exitosamente");
        }

        // ==========================================
        // OBTENER MOVIMIENTOS DE UN INSUMO (paginado en SQL)
        // ==========================================
        public async Task<OperationResult<IEnumerable<MovimientoDto>>> GetMovimientosPorInsumoAsync(
            int insumoId, int? limite = null)
        {
            if (!await _insumoRepo.ExistsAsync(insumoId))
                return OperationResult<IEnumerable<MovimientoDto>>.Fail("El insumo especificado no existe");

            // Usar el nuevo filtro compuesto con paginación real en SQL
            var filter = new MovimientoFilterDto
            {
                IdsInsumo = new List<int> { insumoId },
                SortBy = "fecha",
                SortDescending = true,
                Page = 1,
                PageSize = limite ?? 100
            };

            var paged = await _movRepo.FilterPagedAsync(filter);
            var dtos = paged.Items.Select(MovimientoDto.FromEntity);

            return OperationResult<IEnumerable<MovimientoDto>>.Ok(dtos);
        }

        // ==========================================
        // CALCULAR STOCK DE UN INSUMO
        // ==========================================
        public async Task<int> CalcularStockAsync(int insumoId)
        {
            // La agregación corre en SQL Server, no en C#
            return await _movRepo.GetStockByInsumoAsync(insumoId);
        }

        // ==========================================
        // OBTENER STOCK DE TODOS LOS INSUMOS
        // ==========================================
        public async Task<IEnumerable<StockDto>> GetStockGeneralAsync()
        {
            // UNA SOLA CONSULTA: SQL hace el GROUP BY + SUM, devuelve
            // solo los resultados agregados (una fila por insumo).
            var stockDb = await _movRepo.GetStockGeneralDbAsync();
            var insumos = await _insumoRepo.GetAllAsync();

            var stockDict = stockDb.ToDictionary(s => s.IdInsumo);

            return insumos.Select(i =>
            {
                var s = stockDict.GetValueOrDefault(i.Id);
                return new StockDto
                {
                    IdInsumo = i.Id,
                    CodigoFabrica = i.CodigoFabrica,
                    Descripcion = i.Descripcion,
                    StockActual = s?.StockActual ?? 0,
                    TotalIngresos = s?.TotalIngresos ?? 0,
                    TotalSalidas = s?.TotalSalidas ?? 0
                };
            });
        }

        // ==========================================
        // OBTENER STOCK DE UN SOLO INSUMO
        // ==========================================
        public async Task<OperationResult<StockDto>> GetStockPorInsumoAsync(int insumoId)
        {
            var insumo = await _insumoRepo.GetByIdAsync(insumoId);
            if (insumo == null)
                return OperationResult<StockDto>.Fail("El insumo no existe");

            // GetStockByInsumoAsync ya calcula el stock en SQL
            // sin necesidad de consultar TODOS los insumos
            var stock = await _movRepo.GetStockByInsumoAsync(insumoId);

            return OperationResult<StockDto>.Ok(new StockDto
            {
                IdInsumo = insumoId,
                CodigoFabrica = insumo.CodigoFabrica,
                Descripcion = insumo.Descripcion,
                StockActual = stock,
                TotalIngresos = 0,
                TotalSalidas = 0
            });
        }

        // ==========================================
        // MAPPER: Construye el DTO con los datos disponibles + query puntual al Insumo
        // Evita re-query de la entidad completa con 5 JOINs
        // ==========================================
        private async Task<MovimientoDto> MapToDtoAsync(MovimientoInventario m)
        {
            // Solo cargar el Insumo si no está ya en memoria (necesario para CodigoFabrica)
            if (m.Insumo == null)
            {
                m.Insumo = (await _insumoRepo.GetByIdAsync(m.IdInsumo))!;
            }

            return MovimientoDto.FromEntity(m);
        }
    }
}
