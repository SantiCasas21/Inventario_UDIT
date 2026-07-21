using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Route("api/user")]
    [Authorize(Roles = "Admin")]
    public class UserController : ControllerBase
    {
        private readonly IUserManagementService _userManagementService;

        public UserController(IUserManagementService userManagementService)
        {
            _userManagementService = userManagementService;
        }

        /// GET /api/user
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _userManagementService.GetAllAsync();
            return Ok(result);
        }

        /// GET /api/user/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var result = await _userManagementService.GetByIdAsync(id);
            if (!result.Success)
                return NotFound(result);
            return Ok(result);
        }

        /// PUT /api/user/{id}/deactivate
        [HttpPut("{id}/deactivate")]
        public async Task<IActionResult> Deactivate(string id)
        {
            var result = await _userManagementService.DeactivateAsync(id);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }

        /// PUT /api/user/{id}/activate
        [HttpPut("{id}/activate")]
        public async Task<IActionResult> Activate(string id)
        {
            var result = await _userManagementService.ActivateAsync(id);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }

        /// DELETE /api/user/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var result = await _userManagementService.DeleteAsync(id);
            if (!result.Success)
                return NotFound(result);
            return Ok(result);
        }
    }
}
