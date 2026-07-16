using Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("api/reporte")]
    public class ReporteController : ControllerBase
    {
        private readonly ReporteService _reporteService;

        public ReporteController(ReporteService reporteService)
        {
            _reporteService = reporteService;
        }

        // ==========================================
        // KARDEX DETALLADO (con saldo acumulado)
        // GET /api/reporte/kardex/5?desde=2026-01-01&hasta=2026-12-31
        // ==========================================
        [HttpGet("kardex/{insumoId}")]
        public async Task<IActionResult> GetKardexDetallado(
            int insumoId,
            [FromQuery] DateTime? desde,
            [FromQuery] DateTime? hasta)
        {
            var result = await _reporteService.GetKardexDetalladoAsync(insumoId, desde, hasta);
            if (!result.Success)
                return NotFound(result);

            return Ok(result);
        }

        // ==========================================
        // STOCK CRÍTICO
        // GET /api/reporte/stock-critico?umbral=10
        // ==========================================
        [HttpGet("stock-critico")]
        public async Task<IActionResult> GetStockCritico([FromQuery] int umbral = 10)
        {
            var result = await _reporteService.GetStockCriticoAsync(umbral);
            return Ok(result);
        }

        // ==========================================
        // MOVIMIENTOS POR PERÍODO
        // GET /api/reporte/movimientos?desde=2026-01-01&hasta=2026-12-31&insumoId=5
        // ==========================================
        [HttpGet("movimientos")]
        public async Task<IActionResult> GetMovimientosPorPeriodo(
            [FromQuery] DateTime desde,
            [FromQuery] DateTime hasta,
            [FromQuery] int? insumoId = null)
        {
            var result = await _reporteService.GetMovimientosPorPeriodoAsync(desde, hasta, insumoId);
            return Ok(result);
        }

        // ==========================================
        // RESUMEN POR PROYECTO
        // GET /api/reporte/proyecto
        // GET /api/reporte/proyecto?proyectoId=3
        // ==========================================
        [HttpGet("proyecto")]
        public async Task<IActionResult> GetResumenPorProyecto([FromQuery] int? proyectoId = null)
        {
            var result = await _reporteService.GetResumenPorProyectoAsync(proyectoId);
            return Ok(result);
        }
    }
}
