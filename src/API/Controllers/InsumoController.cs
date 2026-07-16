using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("api/insumo")]
    public class InsumoController : ControllerBase
    {
        private readonly IInsumoRepository _repository;

        public InsumoController(IInsumoRepository repository)
        {
            _repository = repository;
        }

        // ==========================================
        // LISTAR CON FILTROS + PAGINACIÓN
        // GET /api/insumo?page=1&pageSize=20&idCategoria=5&codigoFabrica=RC&descripcion=RES
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] int? idCategoria = null,
            [FromQuery] string? codigoFabrica = null,
            [FromQuery] string? descripcion = null)
        {
            var paged = await _repository.SearchPagedAsync(
                idCategoria, codigoFabrica, descripcion, page, pageSize);

            var dtos = paged.Items.Select(MapToDto).ToList();

            var result = new PagedResult<InsumoDto>
            {
                Page = paged.Page,
                PageSize = paged.PageSize,
                TotalCount = paged.TotalCount,
                Items = dtos
            };

            return Ok(OperationResult<PagedResult<InsumoDto>>.Ok(result));
        }

        // GET /api/insumo/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var insumo = await _repository.GetByIdAsync(id, "Categoria", "Empaquetamiento", "Ubicacion");

            if (insumo == null)
                return NotFound(OperationResult<InsumoDto>.Fail($"Insumo con ID {id} no encontrado"));

            return Ok(OperationResult<InsumoDto>.Ok(MapToDto(insumo)));
        }

        // POST /api/insumo
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] InsumoRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.CodigoFabrica))
                return BadRequest(OperationResult<InsumoDto>.Fail("El código de fábrica es obligatorio"));

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

            return CreatedAtAction(nameof(GetById), new { id = created.Id },
                OperationResult<InsumoDto>.Ok(MapToDto(created), "Insumo creado exitosamente"));
        }

        // PUT /api/insumo/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] InsumoRequestDto request)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null)
                return NotFound(OperationResult<InsumoDto>.Fail($"Insumo con ID {id} no encontrado"));

            entity.IdCategoria = request.IdCategoria;
            entity.CodigoFabrica = request.CodigoFabrica;
            entity.IdEmpaquetamiento = request.IdEmpaquetamiento;
            entity.IdUbicacion = request.IdUbicacion;
            entity.Descripcion = request.Descripcion;
            entity.PrecioReferencia = request.PrecioReferencia;

            await _repository.UpdateAsync(entity);

            var updated = await _repository.GetByIdAsync(id, "Categoria", "Empaquetamiento", "Ubicacion");
            return Ok(OperationResult<InsumoDto>.Ok(MapToDto(updated!), "Insumo actualizado exitosamente"));
        }

        // DELETE /api/insumo/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (!await _repository.ExistsAsync(id))
                return NotFound(OperationResult.Fail($"Insumo con ID {id} no encontrado"));

            await _repository.DeleteAsync(id);
            return Ok(OperationResult.Ok("Insumo eliminado exitosamente"));
        }

        private static InsumoDto MapToDto(Insumo insumo)
        {
            return new InsumoDto
            {
                Id = insumo.Id,
                IdCategoria = insumo.IdCategoria,
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
}
