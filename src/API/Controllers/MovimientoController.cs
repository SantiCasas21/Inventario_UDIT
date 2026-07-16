using Application.DTOs;
using Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("api/movimiento")]
    public class MovimientoController : ControllerBase
    {
        private readonly KardexService _kardexService;

        public MovimientoController(KardexService kardexService)
        {
            _kardexService = kardexService;
        }

        // ==========================================
        // REGISTRAR INGRESO
        // POST /api/movimiento/ingreso
        // ==========================================
        [HttpPost("ingreso")]
        public async Task<IActionResult> RegistrarIngreso([FromBody] MovimientoRequestDto request)
        {
            var result = await _kardexService.RegistrarIngresoAsync(request);
            if (!result.Success)
                return BadRequest(result);

            return CreatedAtAction(nameof(GetMovimientosPorInsumo),
                new { insumoId = request.IdInsumo }, result);
        }

        // ==========================================
        // REGISTRAR SALIDA
        // POST /api/movimiento/salida
        // ==========================================
        [HttpPost("salida")]
        public async Task<IActionResult> RegistrarSalida([FromBody] MovimientoRequestDto request)
        {
            var result = await _kardexService.RegistrarSalidaAsync(request);
            if (!result.Success)
                return BadRequest(result);

            return CreatedAtAction(nameof(GetMovimientosPorInsumo),
                new { insumoId = request.IdInsumo }, result);
        }

        // ==========================================
        // REGISTRAR AJUSTE
        // POST /api/movimiento/ajuste
        // ==========================================
        [HttpPost("ajuste")]
        public async Task<IActionResult> RegistrarAjuste([FromBody] MovimientoRequestDto request)
        {
            var result = await _kardexService.RegistrarAjusteAsync(request);
            if (!result.Success)
                return BadRequest(result);

            return CreatedAtAction(nameof(GetMovimientosPorInsumo),
                new { insumoId = request.IdInsumo }, result);
        }

        // ==========================================
        // MOVIMIENTOS DE UN INSUMO
        // GET /api/movimiento/insumo/5?limite=50
        // ==========================================
        [HttpGet("insumo/{insumoId}")]
        public async Task<IActionResult> GetMovimientosPorInsumo(int insumoId, [FromQuery] int? limite = null)
        {
            var result = await _kardexService.GetMovimientosPorInsumoAsync(insumoId, limite);
            if (!result.Success)
                return NotFound(result);

            return Ok(result);
        }

        // ==========================================
        // STOCK DE UN INSUMO
        // GET /api/movimiento/stock/5
        // ==========================================
        [HttpGet("stock/{insumoId}")]
        public async Task<IActionResult> GetStockPorInsumo(int insumoId)
        {
            var result = await _kardexService.GetStockPorInsumoAsync(insumoId);
            if (!result.Success)
                return NotFound(result);

            return Ok(result);
        }

        // ==========================================
        // STOCK GENERAL (todos los insumos)
        // GET /api/movimiento/stock
        // ==========================================
        [HttpGet("stock")]
        public async Task<IActionResult> GetStockGeneral()
        {
            var stock = await _kardexService.GetStockGeneralAsync();
            return Ok(stock);
        }
    }
}
