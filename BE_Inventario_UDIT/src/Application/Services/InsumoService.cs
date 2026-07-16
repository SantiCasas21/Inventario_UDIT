using Application.Common.Interfaces;
using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;

namespace Application.Services
{
    /// <summary>
    /// Servicio de insumos con validaciones y lógica de negocio.
    /// Extrae la lógica del controlador para mantenerlo thin.
    /// </summary>
    public class InsumoService : IInsumoService
    {
        private readonly IInsumoRepository _repository;

        public InsumoService(IInsumoRepository repository)
        {
            _repository = repository;
        }

        public async Task<OperationResult<PagedResult<InsumoDto>>> GetAllAsync(InsumoFilterDto? filter = null)
        {
            PagedResult<Insumo> paged;

            if (filter != null && (filter.IdsCategoria?.Count > 0 || filter.IdsEmpaquetamiento?.Count > 0
                || filter.IdsUbicacion?.Count > 0 || filter.PrecioMin.HasValue
                || filter.PrecioMax.HasValue || !string.IsNullOrWhiteSpace(filter.TextSearch)))
            {
                paged = await _repository.FilterPagedAsync(filter);
            }
            else
            {
                paged = await _repository.SearchPagedAsync(
                    page: filter?.Page ?? 1, pageSize: filter?.PageSize ?? 20);
            }

            var dtos = paged.Items.Select(MapToDto).ToList();
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

            return OperationResult<InsumoDto>.Ok(MapToDto(insumo));
        }

        public async Task<OperationResult<InsumoDto>> CreateAsync(InsumoRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.CodigoFabrica))
                return OperationResult<InsumoDto>.Fail("El código de fábrica es obligatorio");

            var entity = new Insumo
            {
                IdCategoria = request.IdCategoria,
                CodigoFabrica = request.CodigoFabrica,
                IdEmpaquetamiento = request.IdEmpaquetamiento,
                IdUbicacion = request.IdUbicacion,
                Descripcion = request.Descripcion,
                PrecioReferencia = request.PrecioReferencia
            };

            var created = await _repository.AddAsync(entity);
            return OperationResult<InsumoDto>.Ok(MapToDto(created), "Insumo creado exitosamente");
        }

        public async Task<OperationResult<InsumoDto>> UpdateAsync(int id, InsumoRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.CodigoFabrica))
                return OperationResult<InsumoDto>.Fail("El código de fábrica es obligatorio");

            var entity = await _repository.GetByIdAsync(id, "Categoria", "Empaquetamiento", "Ubicacion");
            if (entity == null)
                return OperationResult<InsumoDto>.Fail($"Insumo con ID {id} no encontrado");

            entity.IdCategoria = request.IdCategoria;
            entity.CodigoFabrica = request.CodigoFabrica;
            entity.IdEmpaquetamiento = request.IdEmpaquetamiento;
            entity.IdUbicacion = request.IdUbicacion;
            entity.Descripcion = request.Descripcion;
            entity.PrecioReferencia = request.PrecioReferencia;

            await _repository.UpdateAsync(entity);
            return OperationResult<InsumoDto>.Ok(MapToDto(entity), "Insumo actualizado exitosamente");
        }

        public async Task<OperationResult> DeleteAsync(int id)
        {
            if (!await _repository.ExistsAsync(id))
                return OperationResult.Fail($"Insumo con ID {id} no encontrado");

            await _repository.DeleteAsync(id);
            return OperationResult.Ok("Insumo eliminado exitosamente");
        }

        private static InsumoDto MapToDto(Insumo insumo) => new()
        {
            Id = insumo.Id, IdCategoria = insumo.IdCategoria,
            CategoriaNombre = insumo.Categoria?.Nombre ?? "",
            CodigoFabrica = insumo.CodigoFabrica,
            IdEmpaquetamiento = insumo.IdEmpaquetamiento,
            EmpaquetamientoNombre = insumo.Empaquetamiento?.Tipo ?? "",
            IdUbicacion = insumo.IdUbicacion,
            UbicacionNombre = insumo.Ubicacion?.Nombre ?? "",
            Descripcion = insumo.Descripcion,
            PrecioReferencia = insumo.PrecioReferencia
        };
    }
}
