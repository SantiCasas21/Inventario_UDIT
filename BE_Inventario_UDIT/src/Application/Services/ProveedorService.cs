using Application.Common.Interfaces;
using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;
using Domain.Entities.Catalogos;

namespace Application.Services
{
    /// <summary>
    /// Servicio de proveedores con validaciones y lógica de negocio.
    /// </summary>
    public class ProveedorService : IProveedorService
    {
        private readonly IBaseRepository<Proveedor> _repository;
        private readonly IAuditoriaService _auditoriaService;

        public ProveedorService(IBaseRepository<Proveedor> repository, IAuditoriaService auditoriaService)
        {
            _repository = repository;
            _auditoriaService = auditoriaService;
        }

        public async Task<OperationResult<IEnumerable<ProveedorFullDto>>> GetAllAsync()
        {
            var proveedores = await _repository.GetAllAsync();
            var dtos = proveedores.Select(MapToDto);
            return OperationResult<IEnumerable<ProveedorFullDto>>.Ok(dtos);
        }

        public async Task<OperationResult<ProveedorFullDto>> GetByIdAsync(int id)
        {
            var proveedor = await _repository.GetByIdAsync(id);
            if (proveedor == null)
                return OperationResult<ProveedorFullDto>.Fail("Proveedor no encontrado");

            return OperationResult<ProveedorFullDto>.Ok(MapToDto(proveedor));
        }

        public async Task<OperationResult<ProveedorFullDto>> CreateAsync(ProveedorFullRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
                return OperationResult<ProveedorFullDto>.Fail("El nombre es obligatorio");

            var allProveedores = await _repository.GetAllAsync();
            if (allProveedores.Any(p => string.Equals(p.Nombre?.Trim(), request.Nombre?.Trim(), StringComparison.OrdinalIgnoreCase)))
            {
                return OperationResult<ProveedorFullDto>.Fail($"Ya existe un proveedor con el nombre '{request.Nombre}'");
            }

            var entity = new Proveedor
            {
                Nombre = request.Nombre,
                Contacto = request.Contacto,
                Direccion = request.Direccion
            };

            var created = await _repository.AddAsync(entity);
            
            await _auditoriaService.LogAsync("CREAR", "Proveedor", $"Se creó el proveedor '{request.Nombre}' con ID {created.Id}");
            
            return OperationResult<ProveedorFullDto>.Ok(MapToDto(created), "Proveedor creado exitosamente");
        }

        public async Task<OperationResult<ProveedorFullDto>> UpdateAsync(int id, ProveedorFullRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
                return OperationResult<ProveedorFullDto>.Fail("El nombre es obligatorio");

            var allProveedores = await _repository.GetAllAsync();
            if (allProveedores.Any(p => p.Id != id && string.Equals(p.Nombre?.Trim(), request.Nombre?.Trim(), StringComparison.OrdinalIgnoreCase)))
            {
                return OperationResult<ProveedorFullDto>.Fail($"Ya existe un proveedor con el nombre '{request.Nombre}'");
            }

            var entity = await _repository.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<ProveedorFullDto>.Fail("Proveedor no encontrado");

            entity.Nombre = request.Nombre;
            entity.Contacto = request.Contacto;
            entity.Direccion = request.Direccion;

            await _repository.UpdateAsync(entity);
            
            await _auditoriaService.LogAsync("EDITAR", "Proveedor", $"Se editó el proveedor '{request.Nombre}' con ID {entity.Id}");
            
            return OperationResult<ProveedorFullDto>.Ok(MapToDto(entity), "Proveedor actualizado exitosamente");
        }

        public async Task<OperationResult> DeleteAsync(int id)
        {
            try
            {
                if (!await _repository.ExistsAsync(id))
                    return OperationResult.Fail("Proveedor no encontrado");

                var entity = await _repository.GetByIdAsync(id);
                string nombre = entity?.Nombre ?? id.ToString();
                
                await _repository.DeleteAsync(id);
                
                await _auditoriaService.LogAsync("ELIMINAR", "Proveedor", $"Se eliminó el proveedor '{nombre}' con ID {id}");
                
                return OperationResult.Ok("Proveedor eliminado exitosamente");
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException)
            {
                return OperationResult.Fail("No se puede eliminar este Proveedor porque está asociado a movimientos en el sistema.");
            }
            catch (Exception ex)
            {
                return OperationResult.Fail($"Ocurrió un error al eliminar: {ex.Message}");
            }
        }

        private static ProveedorFullDto MapToDto(Proveedor p) => new()
        {
            Id = p.Id, Nombre = p.Nombre,
            Contacto = p.Contacto, Direccion = p.Direccion
        };
    }
}
