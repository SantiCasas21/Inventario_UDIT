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
        private readonly IAuditoriaService _auditoriaService;

        public ProyectoService(IBaseRepository<Proyecto> repository, IAuditoriaService auditoriaService)
        {
            _repository = repository;
            _auditoriaService = auditoriaService;
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

            var allProyectos = await _repository.GetAllAsync();
            if (allProyectos.Any(p => string.Equals(p.Nombre?.Trim(), request.Nombre?.Trim(), StringComparison.OrdinalIgnoreCase)))
            {
                return OperationResult<ProyectoDto>.Fail($"Ya existe un proyecto con el nombre '{request.Nombre}'");
            }

            var entity = new Proyecto
            {
                Nombre = request.Nombre,
                Descripcion = request.Descripcion,
                IdEstado = request.IdEstado,
                FechaCreacion = DateTime.UtcNow
            };

            var created = await _repository.AddAsync(entity);
            
            await _auditoriaService.LogAsync("CREAR", "Proyecto", $"Se creó el proyecto '{request.Nombre}' con ID {created.Id}");
            
            return OperationResult<ProyectoDto>.Ok(MapToDto(created), "Proyecto creado exitosamente");
        }

        public async Task<OperationResult<ProyectoDto>> UpdateAsync(int id, ProyectoRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
                return OperationResult<ProyectoDto>.Fail("El nombre del proyecto es obligatorio");

            var allProyectos = await _repository.GetAllAsync();
            if (allProyectos.Any(p => p.Id != id && string.Equals(p.Nombre?.Trim(), request.Nombre?.Trim(), StringComparison.OrdinalIgnoreCase)))
            {
                return OperationResult<ProyectoDto>.Fail($"Ya existe un proyecto con el nombre '{request.Nombre}'");
            }

            var entity = await _repository.GetByIdAsync(id, "Estado");
            if (entity == null)
                return OperationResult<ProyectoDto>.Fail($"Proyecto con ID {id} no encontrado");

            entity.Nombre = request.Nombre;
            entity.Descripcion = request.Descripcion;
            entity.IdEstado = request.IdEstado;

            await _repository.UpdateAsync(entity);
            
            await _auditoriaService.LogAsync("EDITAR", "Proyecto", $"Se editó el proyecto '{request.Nombre}' con ID {entity.Id}");
            
            return OperationResult<ProyectoDto>.Ok(MapToDto(entity), "Proyecto actualizado exitosamente");
        }

        public async Task<OperationResult> DeleteAsync(int id)
        {
            try
            {
                if (!await _repository.ExistsAsync(id))
                    return OperationResult.Fail($"Proyecto con ID {id} no encontrado");

                var entity = await _repository.GetByIdAsync(id);
                string nombre = entity?.Nombre ?? id.ToString();
                
                await _repository.DeleteAsync(id);
                
                await _auditoriaService.LogAsync("ELIMINAR", "Proyecto", $"Se eliminó el proyecto '{nombre}' con ID {id}");
                
                return OperationResult.Ok("Proyecto eliminado exitosamente");
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException)
            {
                return OperationResult.Fail("No se puede eliminar este Proyecto porque está asociado a movimientos en el sistema.");
            }
            catch (Exception ex)
            {
                return OperationResult.Fail($"Ocurrió un error al eliminar: {ex.Message}");
            }
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
