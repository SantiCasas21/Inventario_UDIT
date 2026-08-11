using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    /// <summary>
    /// Controller dedicado de Empaquetamiento.
    /// A diferencia del resto de catálogos (que usan el genérico), este
    /// maneja la clasificación inteligente de familia y el filtrado por categoría.
    /// </summary>
    [ApiController]
    [Route("api/empaquetamiento")]
    [Authorize]
    public class EmpaquetamientoController : ControllerBase
    {
        private readonly IEmpaquetamientoService _service;

        public EmpaquetamientoController(IEmpaquetamientoService service)
        {
            _service = service;
        }

        // GET /api/empaquetamiento
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        // GET /api/empaquetamiento/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            if (!result.Success)
                return NotFound(result);
            return Ok(result);
        }

        // GET /api/empaquetamiento/por-categoria/{idCategoria}
        [HttpGet("por-categoria/{idCategoria}")]
        public async Task<IActionResult> GetPorCategoria(int idCategoria)
        {
            var result = await _service.GetPorCategoriaAsync(idCategoria);
            return Ok(result);
        }

        // GET /api/empaquetamiento/por-categorias?ids=1&ids=2
        [HttpGet("por-categorias")]
        public async Task<IActionResult> GetPorCategorias([FromQuery] int[] ids)
        {
            var result = await _service.GetPorCategoriasAsync(ids);
            return Ok(result);
        }

        // POST /api/empaquetamiento
        [HttpPost]
        [Authorize(Roles = "Admin,Developer")]
        public async Task<IActionResult> Create([FromBody] EmpaquetamientoRequestDto request)
        {
            if (request == null)
                return BadRequest(OperationResult.Fail("El cuerpo de la solicitud no puede estar vacío"));

            var result = await _service.CreateAsync(request);
            if (!result.Success)
                return BadRequest(result);

            return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result);
        }

        // PUT /api/empaquetamiento/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Developer")]
        public async Task<IActionResult> Update(int id, [FromBody] EmpaquetamientoRequestDto request)
        {
            if (request == null)
                return BadRequest(OperationResult.Fail("El cuerpo de la solicitud no puede estar vacío"));

            var result = await _service.UpdateAsync(id, request);
            if (!result.Success)
            {
                if (result.Message.Contains("no encontrado"))
                    return NotFound(result);
                return BadRequest(result);
            }
            return Ok(result);
        }

        // DELETE /api/empaquetamiento/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _service.DeleteAsync(id);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
    }
}
