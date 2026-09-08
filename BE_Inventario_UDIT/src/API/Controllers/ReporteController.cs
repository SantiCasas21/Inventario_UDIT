using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    /// <summary>
    /// DTO para registrar la exportación a Excel en el log de auditoría.
    /// </summary>
    public class LogExportacionRequestDto
    {
        public string NombreReporte { get; set; } = string.Empty;
        public string? Filtros { get; set; }
    }

    [ApiController]
    [Route("api/reporte")]
    [Authorize]
    public class ReporteController : ControllerBase
    {
        private readonly IReporteService _reporteService;
        private readonly IAuditoriaService _auditoriaService;

        public ReporteController(IReporteService reporteService, IAuditoriaService auditoriaService)
        {
            _reporteService = reporteService;
            _auditoriaService = auditoriaService;
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

            await _auditoriaService.LogAsync("CONSULTAR", "Reportes", $"Consulta de reporte Kardex para insumo ID {insumoId}" + (desde.HasValue ? $" desde {desde:yyyy-MM-dd}" : "") + (hasta.HasValue ? $" hasta {hasta:yyyy-MM-dd}" : ""));
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
            await _auditoriaService.LogAsync("CONSULTAR", "Reportes", $"Consulta de reporte Stock Crítico (umbral: {umbral})");
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
            if (desde > hasta)
                return BadRequest(Application.Common.Models.OperationResult.Fail("La fecha 'desde' no puede ser posterior a 'hasta'"));

            var result = await _reporteService.GetMovimientosPorPeriodoAsync(desde, hasta, insumoId);
            await _auditoriaService.LogAsync("CONSULTAR", "Reportes", $"Consulta de reporte Movimientos del período {desde:yyyy-MM-dd} al {hasta:yyyy-MM-dd}" + (insumoId.HasValue ? $" para insumo ID {insumoId}" : ""));
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
            await _auditoriaService.LogAsync("CONSULTAR", "Reportes", $"Consulta de reporte Consumo por Proyecto (Proyecto ID: {proyectoId?.ToString() ?? "Todos"})");
            return Ok(result);
        }

        // ==========================================
        // REGISTRO DE EXPORTACIÓN A EXCEL EN AUDITORÍA
        // POST /api/reporte/log-exportacion
        // ==========================================
        [HttpPost("log-exportacion")]
        public async Task<IActionResult> LogExportacion([FromBody] LogExportacionRequestDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.NombreReporte))
                return BadRequest(Application.Common.Models.OperationResult.Fail("Nombre del reporte requerido"));

            var detalle = $"Exportó a Excel el reporte '{request.NombreReporte}'" +
                          (!string.IsNullOrWhiteSpace(request.Filtros) ? $" con filtros: {request.Filtros}" : "");

            await _auditoriaService.LogAsync("EXPORTAR", "Reportes", detalle);
            return Ok(Application.Common.Models.OperationResult.Ok("Exportación registrada en auditoría"));
        }
    }
}

