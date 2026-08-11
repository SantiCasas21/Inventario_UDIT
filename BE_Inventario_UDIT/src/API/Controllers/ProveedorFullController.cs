using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("api/proveedor-full")]
    [Authorize]
    public class ProveedorFullController : ControllerBase
    {
        private readonly IProveedorService _service;

        public ProveedorFullController(IProveedorService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            if (!result.Success)
                return NotFound(result);
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Developer")]
        public async Task<IActionResult> Create([FromBody] ProveedorFullRequestDto request)
        {
            if (request == null)
                return BadRequest(Application.Common.Models.OperationResult.Fail("Cuerpo de solicitud inválido"));

            var result = await _service.CreateAsync(request);
            if (!result.Success)
                return new ContentResult { StatusCode = 400, Content = "{\"message\":\"" + result.Message + "\"}", ContentType = "application/json" };

            return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Developer")]
        public async Task<IActionResult> Update(int id, [FromBody] ProveedorFullRequestDto request)
        {
            if (request == null)
                return BadRequest(Application.Common.Models.OperationResult.Fail("Cuerpo de solicitud inválido"));

            var result = await _service.UpdateAsync(id, request);
            if (!result.Success)
            {
                if (result.Message.Contains("no encontrado"))
                    return NotFound(result);
                return new ContentResult { StatusCode = 400, Content = "{\"message\":\"" + result.Message + "\"}", ContentType = "application/json" };
            }
            return Ok(result);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _service.DeleteAsync(id);
            if (!result.Success)
                return new ContentResult { StatusCode = 400, Content = "{\"message\":\"" + result.Message + "\"}", ContentType = "application/json" };
            return Ok(result);
        }
    }
}
