using Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    public class DashboardController : ControllerBase
    {
        private readonly ReporteService _reporteService;

        public DashboardController(ReporteService reporteService)
        {
            _reporteService = reporteService;
        }

        /// GET /api/dashboard
        [HttpGet]
        public async Task<IActionResult> GetDashboard()
        {
            var result = await _reporteService.GetDashboardAsync();
            return Ok(result);
        }
    }
}
