using Application.Common.Interfaces;
using Application.Common.Models;
using Application.DTOs;
using Domain.Entities.Catalogos;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    /// <summary>
    /// Controller completo para Proveedor con todos sus campos
    /// (Nombre + Contacto + Direccion).
    /// El endpoint de catálogo (/api/proveedor) sigue funcionando
    /// para operaciones simples de solo nombre.
    /// </summary>
    [ApiController]
    [Route("api/proveedor-full")]
    public class ProveedorFullController : ControllerBase
    {
        private readonly IBaseRepository<Proveedor> _repository;

        public ProveedorFullController(IBaseRepository<Proveedor> repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var proveedores = await _repository.GetAllAsync();
            var dtos = proveedores.Select(MapToDto);
            return Ok(OperationResult<IEnumerable<ProveedorFullDto>>.Ok(dtos));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var proveedor = await _repository.GetByIdAsync(id);
            if (proveedor == null)
                return NotFound(OperationResult<ProveedorFullDto>.Fail("Proveedor no encontrado"));

            return Ok(OperationResult<ProveedorFullDto>.Ok(MapToDto(proveedor)));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ProveedorFullRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
                return BadRequest(OperationResult<ProveedorFullDto>.Fail("El nombre es obligatorio"));

            var entity = new Proveedor
            {
                Nombre = request.Nombre,
                Contacto = request.Contacto,
                Direccion = request.Direccion
            };

            var created = await _repository.AddAsync(entity);

            return CreatedAtAction(nameof(GetById), new { id = created.Id },
                OperationResult<ProveedorFullDto>.Ok(MapToDto(created), "Proveedor creado exitosamente"));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ProveedorFullRequestDto request)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null)
                return NotFound(OperationResult<ProveedorFullDto>.Fail("Proveedor no encontrado"));

            entity.Nombre = request.Nombre;
            entity.Contacto = request.Contacto;
            entity.Direccion = request.Direccion;

            await _repository.UpdateAsync(entity);
            return Ok(OperationResult<ProveedorFullDto>.Ok(MapToDto(entity), "Proveedor actualizado exitosamente"));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (!await _repository.ExistsAsync(id))
                return NotFound(OperationResult.Fail("Proveedor no encontrado"));

            await _repository.DeleteAsync(id);
            return Ok(OperationResult.Ok("Proveedor eliminado exitosamente"));
        }

        private static ProveedorFullDto MapToDto(Proveedor p) => new()
        {
            Id = p.Id,
            Nombre = p.Nombre,
            Contacto = p.Contacto,
            Direccion = p.Direccion
        };
    }
}
