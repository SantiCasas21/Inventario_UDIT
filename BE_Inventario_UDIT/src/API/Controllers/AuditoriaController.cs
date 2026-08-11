using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AuditoriaController : ControllerBase
    {
        private readonly IAuditoriaService _auditoriaService;

        public AuditoriaController(IAuditoriaService auditoriaService)
        {
            _auditoriaService = auditoriaService;
        }

        [HttpGet]
        public async Task<ActionResult<OperationResult<PagedResult<AuditoriaDto>>>> Get(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string textSearch = "",
            [FromQuery] string modulo = "")
        {
            var result = await _auditoriaService.GetLogsAsync(page, pageSize, textSearch, modulo);
            return Ok(OperationResult<PagedResult<AuditoriaDto>>.Ok(result));
        }

        [HttpPost("seed")]
        [AllowAnonymous]
        public async Task<IActionResult> Seed()
        {
            await _auditoriaService.SeedHistoricalDataAsync();
            return Ok(new { message = "Datos históricos sembrados correctamente." });
        }
    }
}
