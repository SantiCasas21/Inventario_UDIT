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
        private readonly IAuditoriaService _auditoriaService;

        public KardexService(
            IMovimientoRepository movRepo,
            IBaseRepository<Insumo> insumoRepo,
            IAuditoriaService auditoriaService)
        {
            _movRepo = movRepo;
            _insumoRepo = insumoRepo;
            _auditoriaService = auditoriaService;
        }

        // ==========================================
        // REGISTRAR INGRESO
        // ==========================================
        public async Task<OperationResult<MovimientoDto>> RegistrarIngresoAsync(MovimientoRequestDto request)
        {
            // Validar que el insumo existe
            var insumo = await _insumoRepo.GetByIdAsync(request.IdInsumo);
            if (insumo == null)
                return OperationResult<MovimientoDto>.Fail("El insumo especificado no existe");

            if (request.Cantidad <= 0)
                return OperationResult<MovimientoDto>.Fail("La cantidad debe ser mayor a 0");

            if (request.IdUbicacion == null)
                return OperationResult<MovimientoDto>.Fail("Debe especificar la ubicación para el ingreso");

            // Actualizar Precio de Referencia al Último Precio de Compra registrado
            if (request.PrecioUnitario.HasValue && request.PrecioUnitario.Value > 0)
            {
                insumo.PrecioReferencia = request.PrecioUnitario.Value;
                await _insumoRepo.UpdateAsync(insumo);
            }

            var movimiento = new MovimientoInventario
            {
                IdInsumo = request.IdInsumo,
                TipoMovimiento = TipoMovimiento.Ingreso,
                Cantidad = request.Cantidad,
                Fecha = DateTime.UtcNow,
                PrecioUnitario = request.PrecioUnitario ?? insumo.PrecioReferencia,
                Moneda = request.Moneda,
                Observacion = request.Observacion,
                IdProveedor = request.IdProveedor,
                IdTipoCompra = request.IdTipoCompra,
                IdUbicacion = request.IdUbicacion,
                UsuarioRegistro = request.UsuarioRegistro
            };

            var created = await _movRepo.AddAsync(movimiento);
            var dto = await MapToDtoAsync(created);
            
            await _auditoriaService.LogAsync("INGRESO", "Movimientos", $"Se ingresaron {request.Cantidad} unidades al insumo ID {request.IdInsumo} en la ubicación {request.IdUbicacion}", request.UsuarioRegistro);

            return OperationResult<MovimientoDto>.Ok(dto, "Ingreso registrado exitosamente");
        }

        // ==========================================
        // REGISTRAR INGRESO MASIVO (DESDE EXCEL)
        // ==========================================
        public async Task<OperationResult<IngresoMasivoResultDto>> RegistrarIngresoMasivoAsync(IngresoMasivoRequestDto request, string usuario)
        {
            if (request == null || request.Movimientos == null || request.Movimientos.Count == 0)
                return OperationResult<IngresoMasivoResultDto>.Fail("No se proporcionaron movimientos para procesar");

            var resultado = new IngresoMasivoResultDto();
            decimal totalInvertido = 0m;

            for (int i = 0; i < request.Movimientos.Count; i++)
            {
                var item = request.Movimientos[i];
                var insumo = await _insumoRepo.GetByIdAsync(item.IdInsumo);
                if (insumo == null)
                {
                    resultado.Errores.Add($"Fila {i + 1}: El insumo con ID {item.IdInsumo} no existe.");
                    continue;
                }

                if (item.Cantidad <= 0)
                {
                    resultado.Errores.Add($"Fila {i + 1} ({insumo.CodigoFabrica}): La cantidad debe ser mayor a 0.");
                    continue;
                }

                if (item.IdUbicacion == null)
                {
                    resultado.Errores.Add($"Fila {i + 1} ({insumo.CodigoFabrica}): Debe especificar la ubicación de ingreso.");
                    continue;
                }

                // Actualizar Precio de Referencia al Último Precio de Compra si se especificó
                if (item.PrecioUnitario.HasValue && item.PrecioUnitario.Value > 0)
                {
                    insumo.PrecioReferencia = item.PrecioUnitario.Value;
                    await _insumoRepo.UpdateAsync(insumo);
                }

                var movimiento = new MovimientoInventario
                {
                    IdInsumo = item.IdInsumo,
                    TipoMovimiento = TipoMovimiento.Ingreso,
                    Cantidad = item.Cantidad,
                    Fecha = DateTime.UtcNow,
                    PrecioUnitario = item.PrecioUnitario ?? insumo.PrecioReferencia,
                    Moneda = item.Moneda ?? insumo.Moneda ?? "COP",
                    Observacion = item.Observacion,
                    IdProveedor = item.IdProveedor,
                    IdTipoCompra = item.IdTipoCompra,
                    IdUbicacion = item.IdUbicacion,
                    UsuarioRegistro = usuario
                };

                var created = await _movRepo.AddAsync(movimiento);
                var dto = await MapToDtoAsync(created);
                resultado.MovimientosCreados.Add(dto);
                resultado.TotalProcesados++;

                if (movimiento.PrecioUnitario.HasValue && movimiento.PrecioUnitario.Value > 0)
                {
                    totalInvertido += movimiento.Cantidad * movimiento.PrecioUnitario.Value;
                }
            }

            resultado.TotalInvertido = Math.Round(totalInvertido, 2);

            await _auditoriaService.LogAsync("INGRESO_MASIVO", "Movimientos",
                $"Se registraron exitosamente {resultado.TotalProcesados} ingresos masivos de insumos por un valor de $ {resultado.TotalInvertido:N2} COP.",
                usuario);

            return OperationResult<IngresoMasivoResultDto>.Ok(resultado, $"Se registraron {resultado.TotalProcesados} insumos exitosamente");
        }

        // ==========================================
        // REGISTRAR SALIDA
        // ==========================================
        public async Task<OperationResult<MovimientoDto>> RegistrarSalidaAsync(MovimientoRequestDto request)
        {
            var insumo = await _insumoRepo.GetByIdAsync(request.IdInsumo);
            if (insumo == null)
                return OperationResult<MovimientoDto>.Fail("El insumo especificado no existe");

            if (request.Cantidad <= 0)
                return OperationResult<MovimientoDto>.Fail("La cantidad debe ser mayor a 0");

            if (request.IdUbicacion == null)
                return OperationResult<MovimientoDto>.Fail("Debe especificar de qué ubicación sale el insumo");

            // Validar stock suficiente en ESA ubicación
            var ubicacionesStock = await _movRepo.GetStockPorUbicacionAsync(request.IdInsumo);
            var stockEnUbicacion = ubicacionesStock.FirstOrDefault(u => u.IdUbicacion == request.IdUbicacion)?.Stock ?? 0;
            
            if (stockEnUbicacion < request.Cantidad)
                return OperationResult<MovimientoDto>.Fail(
                    $"Stock insuficiente en la ubicación seleccionada. Disponible: {stockEnUbicacion}, solicitado: {request.Cantidad}");

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
                PrecioUnitario = (request.PrecioUnitario.HasValue && request.PrecioUnitario.Value > 0)
                    ? request.PrecioUnitario.Value
                    : (insumo.PrecioReferencia ?? 0m),
                Moneda = request.Moneda ?? insumo.Moneda ?? "COP",
                Observacion = request.Observacion,
                IdProyecto = request.IdProyecto,
                IdEstadoSalida = request.IdEstadoSalida,
                IdUbicacion = request.IdUbicacion,
                UsuarioRegistro = request.UsuarioRegistro
            };

            var created = await _movRepo.AddAsync(movimiento);
            var dto = await MapToDtoAsync(created);

            await _auditoriaService.LogAsync("SALIDA", "Movimientos", $"Se sacaron {request.Cantidad} unidades del insumo ID {request.IdInsumo}", request.UsuarioRegistro);

            return OperationResult<MovimientoDto>.Ok(dto, "Salida registrada exitosamente");
        }

        // ==========================================
        // REGISTRAR AJUSTE
        // ==========================================
        public async Task<OperationResult<MovimientoDto>> RegistrarAjusteAsync(MovimientoRequestDto request)
        {
            // Cargar el insumo completo (necesitamos IdUbicacion actual)
            var insumo = await _insumoRepo.GetByIdAsync(request.IdInsumo);
            if (insumo == null)
                return OperationResult<MovimientoDto>.Fail("El insumo especificado no existe");

            if (request.Cantidad == 0 && !request.IdNuevaUbicacion.HasValue)
                return OperationResult<MovimientoDto>.Fail("La cantidad del ajuste no puede ser 0 a menos que sea un traslado (cambio de ubicación)");

            if (string.IsNullOrWhiteSpace(request.Observacion))
                return OperationResult<MovimientoDto>.Fail("Un ajuste requiere una observación");

            if (request.IdUbicacion == null)
                return OperationResult<MovimientoDto>.Fail("Debe especificar la ubicación donde se realizará el ajuste");

            var ubicacionesStock = await _movRepo.GetStockPorUbicacionAsync(request.IdInsumo);
            var stockEnOrigen = ubicacionesStock.FirstOrDefault(u => u.IdUbicacion == request.IdUbicacion)?.Stock ?? 0;

            if (request.Cantidad < 0 && Math.Abs(request.Cantidad) > stockEnOrigen)
            {
                return OperationResult<MovimientoDto>.Fail($"Stock insuficiente en la ubicación origen. Disponible: {stockEnOrigen}");
            }

            var fechaActual = DateTime.UtcNow;
            MovimientoInventario? createdAjuste = null;
            MovimientoInventario? createdTraslado = null;

            // 1. Registrar Ajuste de Cantidad (si hay cantidad)
            if (request.Cantidad != 0)
            {
                var movimientoAjuste = new MovimientoInventario
                {
                    IdInsumo = request.IdInsumo,
                    TipoMovimiento = TipoMovimiento.Ajuste,
                    Cantidad = request.Cantidad,
                    Fecha = fechaActual,
                    Observacion = request.Observacion,
                    IdUbicacion = request.IdUbicacion,
                    UsuarioRegistro = request.UsuarioRegistro
                };
                createdAjuste = await _movRepo.AddAsync(movimientoAjuste);
                await _auditoriaService.LogAsync("AJUSTE", "Movimientos", $"Se ajustó {request.Cantidad} unidades en el insumo ID {request.IdInsumo}", request.UsuarioRegistro);
            }

            // 2. Registrar Traslado (si hay IdNuevaUbicacion)
            if (request.IdNuevaUbicacion.HasValue)
            {
                var stockMover = stockEnOrigen + request.Cantidad;

                if (stockMover > 0)
                {
                    var movimientoTraslado = new MovimientoInventario
                    {
                        IdInsumo = request.IdInsumo,
                        TipoMovimiento = TipoMovimiento.Traslado,
                        Cantidad = stockMover,
                        Fecha = fechaActual.AddSeconds(1),
                        Observacion = "Traslado de ubicación " + request.Observacion,
                        IdUbicacion = request.IdNuevaUbicacion.Value,
                        IdUbicacionAnterior = request.IdUbicacion,
                        UsuarioRegistro = request.UsuarioRegistro
                    };
                    createdTraslado = await _movRepo.AddAsync(movimientoTraslado);
                    await _auditoriaService.LogAsync("TRASLADO", "Movimientos", $"Se trasladó TODO el stock ({stockMover} unidades) del insumo ID {request.IdInsumo} a la ubicación ID {request.IdNuevaUbicacion.Value} (anterior ID {request.IdUbicacion})", request.UsuarioRegistro);
                }
            }

            // Mapear a DTO (devolvemos el principal)
            var dto = await MapToDtoAsync(createdTraslado ?? createdAjuste!);

            return OperationResult<MovimientoDto>.Ok(dto, "Ajuste/Traslado registrado exitosamente");
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
