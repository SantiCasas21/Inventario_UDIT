using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("api/insumo")]
    [Authorize]
    public class InsumoController : ControllerBase
    {
        private readonly IInsumoService _service;

        public InsumoController(IInsumoService service)
        {
            _service = service;
        }

        // GET /api/insumo?page=1&pageSize=20
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] InsumoFilterDto filter)
        {
            var result = await _service.GetAllAsync(filter);
            return Ok(result);
        }

        // POST /api/insumo/filter
        [HttpPost("filter")]
        public async Task<IActionResult> Filter([FromBody] InsumoFilterDto filter)
        {
            var result = await _service.GetAllAsync(filter);
            return Ok(result);
        }

        // GET /api/insumo/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            if (!result.Success)
                return NotFound(result);
            return Ok(result);
        }

        // POST /api/insumo
        [HttpPost]
        [Authorize(Roles = "Admin,Developer,Assistant")]
        public async Task<IActionResult> Create([FromBody] InsumoRequestDto request)
        {
            if (request == null)
                return BadRequest(Application.Common.Models.OperationResult.Fail("Cuerpo de solicitud inválido"));

            var result = await _service.CreateAsync(request);
            if (!result.Success)
                return BadRequest(result);

            return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result);
        }

        // PUT /api/insumo/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Developer,Assistant")]
        public async Task<IActionResult> Update(int id, [FromBody] InsumoRequestDto request)
        {
            if (request == null)
                return BadRequest(Application.Common.Models.OperationResult.Fail("Cuerpo de solicitud inválido"));

            var result = await _service.UpdateAsync(id, request);
            if (!result.Success)
            {
                if (result.Message.Contains("no encontrado"))
                    return NotFound(result);
                return BadRequest(result);
            }
            return Ok(result);
        }

        // DELETE /api/insumo/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _service.DeleteAsync(id);
            if (!result.Success)
                return new ContentResult { StatusCode = 400, Content = "{\"message\":\"" + result.Message + "\"}", ContentType = "application/json" };
            return Ok(result);
        }

        // ==========================================
        // UBICACIONES DISPONIBLES
        // GET /api/insumo/ubicaciones-disponibles
        // ==========================================
        /// <summary>
        /// Retorna solo las ubicaciones que están vacías (sin insumos con stock > 0).
        /// Útil para el formulario de creación de insumos.
        /// </summary>
        [HttpGet("ubicaciones-disponibles")]
        public async Task<IActionResult> GetUbicacionesDisponibles()
        {
            var ubicaciones = await _service.GetUbicacionesDisponiblesAsync();
            return Ok(Application.Common.Models.OperationResult<List<CatalogoDto>>.Ok(ubicaciones));
        }

        public class UnificarRequest
        {
            public string CodigoFabrica { get; set; } = string.Empty;
            public int IdInsumoPrincipal { get; set; }
        }

        // POST /api/insumo/unificar
        [HttpPost("unificar")]
        [Authorize(Roles = "Admin,Developer")]
        public async Task<IActionResult> UnificarDuplicados([FromBody] UnificarRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.CodigoFabrica))
                return BadRequest(Application.Common.Models.OperationResult.Fail("Datos inválidos"));

            var result = await _service.UnificarDuplicadosAsync(request.CodigoFabrica, request.IdInsumoPrincipal);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
    }
}
