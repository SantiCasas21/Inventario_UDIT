using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly IReporteService _reporteService;

        public DashboardController(IReporteService reporteService)
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
