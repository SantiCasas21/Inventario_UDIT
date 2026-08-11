using Application.Common.Interfaces;
using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Domain.Entities.Catalogos;

namespace Application.Services
{
    /// <summary>
    /// Servicio de insumos con validaciones y lógica de negocio.
    /// Extrae la lógica del controlador para mantenerlo thin.
    /// </summary>
    public class InsumoService : IInsumoService
    {
        private readonly IInsumoRepository _repository;
        private readonly IMovimientoRepository _movRepo;
        private readonly IBaseRepository<Ubicacion> _ubicacionRepo;
        private readonly IAuditoriaService _auditoriaService;
        private readonly Microsoft.AspNetCore.Http.IHttpContextAccessor _httpContextAccessor;

        public InsumoService(IInsumoRepository repository, IMovimientoRepository movRepo,
            IBaseRepository<Ubicacion> ubicacionRepo, IAuditoriaService auditoriaService,
            Microsoft.AspNetCore.Http.IHttpContextAccessor httpContextAccessor)
        {
            _repository = repository;
            _movRepo = movRepo;
            _ubicacionRepo = ubicacionRepo;
            _auditoriaService = auditoriaService;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<OperationResult<PagedResult<InsumoDto>>> GetAllAsync(InsumoFilterDto? filter = null)
        {
            PagedResult<Insumo> paged;

            // Manejar filtro por IdsUbicacion desde Movimientos (ya que Insumo no tiene IdUbicacion)
            if (filter?.IdsUbicacion?.Count > 0)
            {
                var stockGeneral = await _movRepo.GetStockGeneralDbAsync();
                
                var insumoIdsConStockEnUbicacion = new HashSet<int>();
                foreach (var s in stockGeneral.Where(x => x.StockActual > 0))
                {
                    var ubiStock = await _movRepo.GetStockPorUbicacionAsync(s.IdInsumo);
                    if (ubiStock.Any(u => filter.IdsUbicacion.Contains(u.IdUbicacion) && u.Stock > 0))
                    {
                        insumoIdsConStockEnUbicacion.Add(s.IdInsumo);
                    }
                }
                
                if (filter.IdsInsumo == null) filter.IdsInsumo = new List<int>();
                
                // Intersectar con IdsInsumo si ya existía
                if (filter.IdsInsumo.Count > 0)
                {
                    filter.IdsInsumo = filter.IdsInsumo.Intersect(insumoIdsConStockEnUbicacion).ToList();
                }
                else
                {
                    filter.IdsInsumo = insumoIdsConStockEnUbicacion.ToList();
                }
                
                // Si la intersección o el resultado es 0, no hay insumos que cumplan el filtro
                if (filter.IdsInsumo.Count == 0)
                {
                    // Forzar que no devuelva nada agregando un ID inexistente
                    filter.IdsInsumo.Add(-1);
                }
            }

            if (filter != null && (filter.IdsCategoria?.Count > 0 || filter.IdsEmpaquetamiento?.Count > 0
                || filter.IdsInsumo?.Count > 0 || filter.UnidadesMedida?.Count > 0 || filter.ValorMedidaMin.HasValue
                || filter.ValorMedidaMax.HasValue || !string.IsNullOrWhiteSpace(filter.TextSearch)))
            {
                paged = await _repository.FilterPagedAsync(filter);
            }
            else
            {
                paged = await _repository.SearchPagedAsync(
                    page: filter?.Page ?? 1, pageSize: filter?.PageSize ?? 20);
            }

            var stockDb = await _movRepo.GetStockGeneralDbAsync();
            var stockDict = stockDb.ToDictionary(s => s.IdInsumo);

            var insumoIds = paged.Items.Select(i => i.Id).ToArray();
            var ubicacionesStockDict = await _movRepo.GetStockPorUbicacionPorInsumosAsync(insumoIds);

            var dtos = paged.Items.Select(i => 
            {
                var dto = MapToDto(i);
                dto.Cantidad = stockDict.GetValueOrDefault(i.Id)?.StockActual ?? 0;
                var ubiResults = ubicacionesStockDict.GetValueOrDefault(i.Id) ?? new List<StockUbicacionResult>();
                dto.UbicacionesStock = ubiResults.Select(u => new StockUbicacionDto 
                { 
                    IdUbicacion = u.IdUbicacion, 
                    UbicacionNombre = u.UbicacionNombre, 
                    Stock = u.Stock 
                }).ToList();
                return dto;
            }).ToList();

            return OperationResult<PagedResult<InsumoDto>>.Ok(new PagedResult<InsumoDto>
            {
                Page = paged.Page, PageSize = paged.PageSize,
                TotalCount = paged.TotalCount, Items = dtos
            });
        }

        public async Task<OperationResult<InsumoDto>> GetByIdAsync(int id)
        {
            var insumo = await _repository.GetByIdAsync(id, "Categoria", "Empaquetamiento", "Ubicacion");
            if (insumo == null)
                return OperationResult<InsumoDto>.Fail($"Insumo con ID {id} no encontrado");

            var dto = MapToDto(insumo);
            dto.Cantidad = await _movRepo.GetStockByInsumoAsync(id);
            var ubiResults = await _movRepo.GetStockPorUbicacionAsync(id);
            dto.UbicacionesStock = ubiResults.Select(u => new StockUbicacionDto 
            { 
                IdUbicacion = u.IdUbicacion, 
                UbicacionNombre = u.UbicacionNombre, 
                Stock = u.Stock 
            }).ToList();

            return OperationResult<InsumoDto>.Ok(dto);
        }

        public async Task<OperationResult<InsumoDto>> CreateAsync(InsumoRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.CodigoFabrica))
                return OperationResult<InsumoDto>.Fail("El código de fábrica es obligatorio");

            if (request.CodigoFabrica.Trim().Equals("N/A", StringComparison.OrdinalIgnoreCase))
                return OperationResult<InsumoDto>.Fail("No se puede crear un insumo con código de fábrica 'N/A'");

            // Prevent duplicate CodigoFabrica
            var existing = await _repository.FindAsync(i => i.CodigoFabrica == request.CodigoFabrica);
            if (existing.Any())
                return OperationResult<InsumoDto>.Fail("Ya existe un insumo con ese código de fábrica. ¿Desea registrar un movimiento en su lugar?", "DUPLICATE_CODE");

            var entity = new Insumo
            {
                IdCategoria = request.IdCategoria,
                CodigoFabrica = request.CodigoFabrica,
                IdEmpaquetamiento = request.IdEmpaquetamiento,
                Descripcion = request.Descripcion,
                PrecioReferencia = request.PrecioReferencia,
                Moneda = request.Moneda,
                ValorMedida = request.ValorMedida,
                UnidadMedida = request.UnidadMedida
            };

            var created = await _repository.AddAsync(entity);
            await _auditoriaService.LogAsync("CREAR", "Insumos", $"Se creó el insumo '{created.CodigoFabrica}' (ID {created.Id})");
            return OperationResult<InsumoDto>.Ok(MapToDto(created), "Insumo creado exitosamente");
        }

        public async Task<OperationResult<InsumoDto>> UpdateAsync(int id, InsumoRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.CodigoFabrica))
                return OperationResult<InsumoDto>.Fail("El código de fábrica es obligatorio");

            var entity = await _repository.GetByIdAsync(id, "Categoria", "Empaquetamiento");
            if (entity == null)
                return OperationResult<InsumoDto>.Fail($"Insumo con ID {id} no encontrado");

            entity.IdCategoria = request.IdCategoria;
            entity.CodigoFabrica = request.CodigoFabrica;
            entity.IdEmpaquetamiento = request.IdEmpaquetamiento;
            entity.Descripcion = request.Descripcion;
            entity.PrecioReferencia = request.PrecioReferencia;
            entity.Moneda = request.Moneda;
            entity.ValorMedida = request.ValorMedida;
            entity.UnidadMedida = request.UnidadMedida;

            await _repository.UpdateAsync(entity);
            await _auditoriaService.LogAsync("EDITAR", "Insumos", $"Se editó el insumo '{entity.CodigoFabrica}' (ID {entity.Id})");

            return OperationResult<InsumoDto>.Ok(MapToDto(entity), "Insumo actualizado exitosamente");
        }

        public async Task<OperationResult> DeleteAsync(int id)
        {
            if (!await _repository.ExistsAsync(id))
                return OperationResult.Fail($"Insumo con ID {id} no encontrado");

            try
            {
                await _repository.DeleteAsync(id);
                await _auditoriaService.LogAsync("ELIMINAR", "Insumos", $"Se eliminó el insumo con ID {id}");
                return OperationResult.Ok("Insumo eliminado exitosamente");
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException)
            {
                return OperationResult.Fail("No se puede eliminar este Insumo porque está asociado a movimientos u otros registros en el sistema.");
            }
            catch (Exception ex)
            {
                return OperationResult.Fail($"Ocurrió un error al eliminar: {ex.Message}");
            }
        }

        private static InsumoDto MapToDto(Insumo insumo) => new()
        {
            Id = insumo.Id,
            IdCategoria = insumo.IdCategoria,
            CategoriaNombre = insumo.Categoria?.Nombre ?? "",
            CodigoFabrica = insumo.CodigoFabrica,
            IdEmpaquetamiento = insumo.IdEmpaquetamiento,
            EmpaquetamientoNombre = insumo.Empaquetamiento?.Tipo ?? "",
            Descripcion = insumo.Descripcion,
            PrecioReferencia = insumo.PrecioReferencia,
            Moneda = insumo.Moneda,
            ValorMedida = insumo.ValorMedida,
            UnidadMedida = insumo.UnidadMedida
        };

        /// <summary>
        /// Retorna las ubicaciones que NO tienen insumos con stock > 0.
        /// Se usa para filtrar ubicaciones disponibles al crear un nuevo insumo.
        /// </summary>
        public async Task<List<CatalogoDto>> GetUbicacionesDisponiblesAsync()
        {
            var todas = await _ubicacionRepo.GetAllAsync();
            var stockGeneral = await _movRepo.GetStockGeneralDbAsync();

            var insumosConStock = stockGeneral
                .Where(s => s.StockActual > 0)
                .Select(s => s.IdInsumo)
                .ToHashSet();

            // Obtenemos los movimientos para saber qué ubicaciones tienen stock
            var paged = await _movRepo.GetPagedAsync(1, int.MaxValue, m => insumosConStock.Contains(m.IdInsumo), null, "");
            var ubicacionesOcupadas = paged.Items
                .Where(m => m.IdUbicacion.HasValue)
                .Select(m => m.IdUbicacion.Value)
                .Distinct()
                .ToHashSet();

            var vacias = todas
                .Where(u => !ubicacionesOcupadas.Contains(u.Id))
                .Select(u => new CatalogoDto { Id = u.Id, Nombre = u.Nombre })
                .OrderBy(u => u.Nombre)
                .ToList();

            return vacias;
        }

        public async Task<OperationResult> UnificarDuplicadosAsync(string codigoFabrica, int idInsumoPrincipal)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(codigoFabrica) || codigoFabrica.Trim().Equals("N/A", StringComparison.OrdinalIgnoreCase))
                    return OperationResult.Fail("No se puede unificar insumos con código 'N/A' o vacío.");

                // 1. Encontrar todos los insumos con ese código
                var insumos = (await _repository.FindAsync(i => i.CodigoFabrica == codigoFabrica)).ToList();

                if (insumos.Count <= 1)
                    return OperationResult.Fail("No hay insumos duplicados para unificar.");

                var insumoPrincipal = insumos.FirstOrDefault(i => i.Id == idInsumoPrincipal);
                if (insumoPrincipal == null)
                    return OperationResult.Fail("El insumo principal seleccionado no existe.");

                // 2. Obtener los IDs de los insumos que se van a eliminar
                var idsAEliminar = insumos.Where(i => i.Id != idInsumoPrincipal).Select(i => i.Id).ToArray();

                // 3. Migrar los movimientos de inventario
                await _movRepo.MigrateMovimientosAsync(idsAEliminar, idInsumoPrincipal);

                var userClaims = _httpContextAccessor.HttpContext?.User;
                var usuario = userClaims?.Identity?.Name ?? "Sistema";

                // Calcular el stock actualizado del insumo principal (que ya heredó todo el historial)
                var stockUnificado = await _movRepo.GetStockByInsumoAsync(idInsumoPrincipal);

                // Crear el registro de sticker para CADA insumo eliminado
                var duplicados = insumos.Where(i => i.Id != idInsumoPrincipal).ToList();
                // NO creamos movimientos artificiales de unificación de ubicación.
                // Simplemente migramos los movimientos existentes, lo que preserva su IdUbicacion original.
                // Sin embargo, si se desea dejar un rastro, se podría hacer, pero la migración ya hace que
                // el insumo principal herede el stock en esas ubicaciones.

                // Opcional: Crear un registro informativo en el historial del insumo principal
                var movUnificacion = new MovimientoInventario
                {
                    IdInsumo = idInsumoPrincipal,
                    TipoMovimiento = Domain.Enums.TipoMovimiento.Unificacion,
                    Cantidad = 0, // No altera stock real, solo informativo
                    Fecha = DateTime.UtcNow,
                    // IdUbicacion no se setea para que no se sesgue a una sola ubicación
                    Observacion = $"Unificación consolidada. El insumo absorbió el historial de los insumos duplicados.",
                    UsuarioRegistro = usuario
                };
                await _movRepo.AddAsync(movUnificacion);

                // 4. Eliminar los insumos duplicados
                foreach (var id in idsAEliminar)
                {
                    await _repository.DeleteAsync(id);
                }

                await _auditoriaService.LogAsync("UNIFICAR", "Insumos", $"Se unificaron los insumos {string.Join(", ", idsAEliminar)} en el insumo principal ID {idInsumoPrincipal}.", usuario);

                return OperationResult.Ok($"Se unificaron {idsAEliminar.Length} insumos correctamente.");
            }
            catch (Exception ex)
            {
                return OperationResult.Fail($"Error Interno de Servidor: {ex.Message} - Inner: {ex.InnerException?.Message}");
            }
        }
    }
}
