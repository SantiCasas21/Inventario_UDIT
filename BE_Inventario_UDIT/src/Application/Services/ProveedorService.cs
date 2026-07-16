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

        public ProveedorService(IBaseRepository<Proveedor> repository)
        {
            _repository = repository;
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

            var entity = new Proveedor
            {
                Nombre = request.Nombre,
                Contacto = request.Contacto,
                Direccion = request.Direccion
            };

            var created = await _repository.AddAsync(entity);
            return OperationResult<ProveedorFullDto>.Ok(MapToDto(created), "Proveedor creado exitosamente");
        }

        public async Task<OperationResult<ProveedorFullDto>> UpdateAsync(int id, ProveedorFullRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
                return OperationResult<ProveedorFullDto>.Fail("El nombre es obligatorio");

            var entity = await _repository.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<ProveedorFullDto>.Fail("Proveedor no encontrado");

            entity.Nombre = request.Nombre;
            entity.Contacto = request.Contacto;
            entity.Direccion = request.Direccion;

            await _repository.UpdateAsync(entity);
            return OperationResult<ProveedorFullDto>.Ok(MapToDto(entity), "Proveedor actualizado exitosamente");
        }

        public async Task<OperationResult> DeleteAsync(int id)
        {
            if (!await _repository.ExistsAsync(id))
                return OperationResult.Fail("Proveedor no encontrado");

            await _repository.DeleteAsync(id);
            return OperationResult.Ok("Proveedor eliminado exitosamente");
        }

        private static ProveedorFullDto MapToDto(Proveedor p) => new()
        {
            Id = p.Id, Nombre = p.Nombre,
            Contacto = p.Contacto, Direccion = p.Direccion
        };
    }
}
