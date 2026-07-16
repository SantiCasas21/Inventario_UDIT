using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("api/movimiento")]
    [Authorize]
    public class MovimientoController : ControllerBase
    {
        private readonly IKardexService _kardexService;
        private readonly IMovimientoRepository _movRepo;

        public MovimientoController(IKardexService kardexService, IMovimientoRepository movRepo)
        {
            _kardexService = kardexService;
            _movRepo = movRepo;
        }

        // ==========================================
        // REGISTRAR INGRESO
        // POST /api/movimiento/ingreso
        // ==========================================
        [HttpPost("ingreso")]
        [Authorize(Roles = "Admin,Developer,Assistant")]
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
        [Authorize(Roles = "Admin,Developer,Assistant")]
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
        [Authorize(Roles = "Admin,Developer,Assistant")]
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
            return Ok(Application.Common.Models.OperationResult<IEnumerable<StockDto>>.Ok(stock));
        }

        // ==========================================
        // FILTRO COMPUESTO DE MOVIMIENTOS
        // POST /api/movimiento/filter
        // Body: { "tiposMovimiento": ["INGRESO"], "fechaDesde": "2026-01-01", "page": 1 }
        // ==========================================
        [HttpPost("filter")]
        public async Task<IActionResult> Filter([FromBody] MovimientoFilterDto filter)
        {
            var paged = await _movRepo.FilterPagedAsync(filter);

            var dtos = paged.Items.Select(MovimientoDto.FromEntity).ToList();

            var result = new PagedResult<MovimientoDto>
            {
                Page = paged.Page,
                PageSize = paged.PageSize,
                TotalCount = paged.TotalCount,
                Items = dtos
            };

            return Ok(Application.Common.Models.OperationResult<PagedResult<MovimientoDto>>.Ok(result));
        }
    }
}
