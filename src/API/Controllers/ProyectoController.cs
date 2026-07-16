using Application.Common.Interfaces;
using Application.Common.Models;
using Application.DTOs;
using Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("api/proyecto")]
    public class ProyectoController : ControllerBase
    {
        private readonly IBaseRepository<Proyecto> _repository;

        public ProyectoController(IBaseRepository<Proyecto> repository)
        {
            _repository = repository;
        }

        // GET /api/proyecto
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var proyectos = await _repository.GetAllAsync("Estado");

            var dtos = proyectos.Select(MapToDto);
            return Ok(OperationResult<IEnumerable<ProyectoDto>>.Ok(dtos));
        }

        // GET /api/proyecto/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var proyecto = await _repository.GetByIdAsync(id, "Estado");

            if (proyecto == null)
                return NotFound(OperationResult<ProyectoDto>.Fail($"Proyecto con ID {id} no encontrado"));

            return Ok(OperationResult<ProyectoDto>.Ok(MapToDto(proyecto)));
        }

        // POST /api/proyecto
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ProyectoRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
                return BadRequest(OperationResult<ProyectoDto>.Fail("El nombre del proyecto es obligatorio"));

            var entity = new Proyecto
            {
                Nombre = request.Nombre,
                Descripcion = request.Descripcion,
                IdEstado = request.IdEstado,
                FechaCreacion = DateTime.UtcNow
            };

            var created = await _repository.AddAsync(entity);
            var dto = new ProyectoDto
            {
                Id = created.Id,
                Nombre = created.Nombre,
                Descripcion = created.Descripcion,
                IdEstado = created.IdEstado,
                FechaCreacion = created.FechaCreacion
            };

            return CreatedAtAction(nameof(GetById), new { id = dto.Id },
                OperationResult<ProyectoDto>.Ok(dto, "Proyecto creado exitosamente"));
        }

        // PUT /api/proyecto/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ProyectoRequestDto request)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null)
                return NotFound(OperationResult<ProyectoDto>.Fail($"Proyecto con ID {id} no encontrado"));

            entity.Nombre = request.Nombre;
            entity.Descripcion = request.Descripcion;
            entity.IdEstado = request.IdEstado;

            await _repository.UpdateAsync(entity);

            var updated = await _repository.GetByIdAsync(id, "Estado");
            return Ok(OperationResult<ProyectoDto>.Ok(MapToDto(updated!), "Proyecto actualizado exitosamente"));
        }

        // DELETE /api/proyecto/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (!await _repository.ExistsAsync(id))
                return NotFound(OperationResult.Fail($"Proyecto con ID {id} no encontrado"));

            await _repository.DeleteAsync(id);
            return Ok(OperationResult.Ok("Proyecto eliminado exitosamente"));
        }

        // ==========================================
        // Mapper privado
        // ==========================================
        private static ProyectoDto MapToDto(Proyecto proyecto)
        {
            return new ProyectoDto
            {
                Id = proyecto.Id,
                Nombre = proyecto.Nombre,
                Descripcion = proyecto.Descripcion,
                IdEstado = proyecto.IdEstado,
                EstadoNombre = proyecto.Estado?.Estado ?? "",
                FechaCreacion = proyecto.FechaCreacion
            };
        }
    }
}
