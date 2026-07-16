using Application.Common.Interfaces;
using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;

namespace Application.Services
{
    /// <summary>
    /// Servicio de proyectos con validaciones y lógica de negocio.
    /// </summary>
    public class ProyectoService : IProyectoService
    {
        private readonly IBaseRepository<Proyecto> _repository;

        public ProyectoService(IBaseRepository<Proyecto> repository)
        {
            _repository = repository;
        }

        public async Task<OperationResult<IEnumerable<ProyectoDto>>> GetAllAsync()
        {
            var proyectos = await _repository.GetAllAsync("Estado");
            var dtos = proyectos.Select(MapToDto);
            return OperationResult<IEnumerable<ProyectoDto>>.Ok(dtos);
        }

        public async Task<OperationResult<ProyectoDto>> GetByIdAsync(int id)
        {
            var proyecto = await _repository.GetByIdAsync(id, "Estado");
            if (proyecto == null)
                return OperationResult<ProyectoDto>.Fail($"Proyecto con ID {id} no encontrado");

            return OperationResult<ProyectoDto>.Ok(MapToDto(proyecto));
        }

        public async Task<OperationResult<ProyectoDto>> CreateAsync(ProyectoRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
                return OperationResult<ProyectoDto>.Fail("El nombre del proyecto es obligatorio");

            var entity = new Proyecto
            {
                Nombre = request.Nombre,
                Descripcion = request.Descripcion,
                IdEstado = request.IdEstado,
                FechaCreacion = DateTime.UtcNow
            };

            var created = await _repository.AddAsync(entity);
            return OperationResult<ProyectoDto>.Ok(MapToDto(created), "Proyecto creado exitosamente");
        }

        public async Task<OperationResult<ProyectoDto>> UpdateAsync(int id, ProyectoRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
                return OperationResult<ProyectoDto>.Fail("El nombre del proyecto es obligatorio");

            var entity = await _repository.GetByIdAsync(id, "Estado");
            if (entity == null)
                return OperationResult<ProyectoDto>.Fail($"Proyecto con ID {id} no encontrado");

            entity.Nombre = request.Nombre;
            entity.Descripcion = request.Descripcion;
            entity.IdEstado = request.IdEstado;

            await _repository.UpdateAsync(entity);
            return OperationResult<ProyectoDto>.Ok(MapToDto(entity), "Proyecto actualizado exitosamente");
        }

        public async Task<OperationResult> DeleteAsync(int id)
        {
            if (!await _repository.ExistsAsync(id))
                return OperationResult.Fail($"Proyecto con ID {id} no encontrado");

            await _repository.DeleteAsync(id);
            return OperationResult.Ok("Proyecto eliminado exitosamente");
        }

        private static ProyectoDto MapToDto(Proyecto p) => new()
        {
            Id = p.Id, Nombre = p.Nombre, Descripcion = p.Descripcion,
            IdEstado = p.IdEstado,
            EstadoNombre = p.Estado?.Estado ?? "",
            FechaCreacion = p.FechaCreacion
        };
    }
}
