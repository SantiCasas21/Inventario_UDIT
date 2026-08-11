using Application.Common.Interfaces;
using Application.Common.Models;
using Domain.Entities.Catalogos;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace API.Controllers
{
    public class UnidadMedidaDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public int IdCategoria { get; set; }
    }

    public class UnidadMedidaRequestDto
    {
        public string Nombre { get; set; } = string.Empty;
        public int IdCategoria { get; set; }
    }

    [ApiController]
    [Route("api/unidad-medida")]
    public class UnidadMedidaController : ControllerBase
    {
        private readonly IBaseRepository<UnidadMedida> _repository;

        public UnidadMedidaController(IBaseRepository<UnidadMedida> repository)
        {
            _repository = repository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var items = await _repository.GetAllAsync();
            var dtos = items.Select(x => new UnidadMedidaDto
            {
                Id = x.Id,
                Nombre = x.Nombre,
                IdCategoria = x.IdCategoria
            });
            return Ok(OperationResult<IEnumerable<UnidadMedidaDto>>.Ok(dtos));
        }

        [HttpGet("categoria/{idCategoria}")]
        public async Task<IActionResult> GetByCategoria(int idCategoria)
        {
            var items = await _repository.FindAsync(x => x.IdCategoria == idCategoria);
            var dtos = items.Select(x => new UnidadMedidaDto
            {
                Id = x.Id,
                Nombre = x.Nombre,
                IdCategoria = x.IdCategoria
            });
            return Ok(OperationResult<IEnumerable<UnidadMedidaDto>>.Ok(dtos));
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] UnidadMedidaRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
                return BadRequest(OperationResult<UnidadMedidaDto>.Fail("El nombre no puede estar vacío"));

            var entity = new UnidadMedida
            {
                Nombre = request.Nombre,
                IdCategoria = request.IdCategoria
            };

            var created = await _repository.AddAsync(entity);
            var dto = new UnidadMedidaDto
            {
                Id = created.Id,
                Nombre = created.Nombre,
                IdCategoria = created.IdCategoria
            };

            return Ok(OperationResult<UnidadMedidaDto>.Ok(dto, "Unidad de medida creada exitosamente"));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UnidadMedidaRequestDto request)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null)
                return NotFound(OperationResult<UnidadMedidaDto>.Fail("Unidad de medida no encontrada"));

            entity.Nombre = request.Nombre;
            entity.IdCategoria = request.IdCategoria;

            await _repository.UpdateAsync(entity);

            var dto = new UnidadMedidaDto
            {
                Id = entity.Id,
                Nombre = entity.Nombre,
                IdCategoria = entity.IdCategoria
            };

            return Ok(OperationResult<UnidadMedidaDto>.Ok(dto, "Unidad de medida actualizada exitosamente"));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                if (!await _repository.ExistsAsync(id))
                    return NotFound(OperationResult.Fail("Unidad de medida no encontrada"));

                await _repository.DeleteAsync(id);
                return Ok(OperationResult.Ok("Unidad de medida eliminada exitosamente"));
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException)
            {
                return new ContentResult { StatusCode = 400, Content = "{\"message\":\"No se puede eliminar este registro porque está siendo utilizado en insumos o movimientos del sistema.\"}", ContentType = "application/json" };
            }
            catch (System.Exception)
            {
                return new ContentResult { StatusCode = 400, Content = "{\"message\":\"Ocurrió un error al eliminar el registro.\"}", ContentType = "application/json" };
            }
        }
    }
}
