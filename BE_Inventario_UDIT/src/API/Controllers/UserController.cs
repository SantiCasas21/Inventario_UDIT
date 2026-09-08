using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers
{
    [ApiController]
    [Route("api/user")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserManagementService _userManagementService;

        public UserController(IUserManagementService userManagementService)
        {
            _userManagementService = userManagementService;
        }

        private string? GetCurrentUserId() => User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        /// GET /api/user
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var canView = await _userManagementService.UserHasPermissionAsync(userId, "usuarios.ver") ||
                          await _userManagementService.UserHasPermissionAsync(userId, "usuarios.gestionar");

            if (!canView)
                return StatusCode(StatusCodes.Status403Forbidden, OperationResult.Fail("No tienes permisos para ver la lista de usuarios."));

            var result = await _userManagementService.GetAllAsync();
            return Ok(result);
        }

        /// POST /api/user
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUserAdminDto request)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var canManage = await _userManagementService.UserHasPermissionAsync(userId, "usuarios.gestionar");
            if (!canManage)
                return StatusCode(StatusCodes.Status403Forbidden, OperationResult.Fail("No tienes permisos para registrar nuevos usuarios."));

            var currentUsername = User.Identity?.Name;
            var result = await _userManagementService.CreateUserAsync(request, currentUsername);
            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        /// GET /api/user/{id}

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var canView = await _userManagementService.UserHasPermissionAsync(userId, "usuarios.ver") ||
                          await _userManagementService.UserHasPermissionAsync(userId, "usuarios.gestionar");

            if (!canView)
                return StatusCode(StatusCodes.Status403Forbidden, OperationResult.Fail("No tienes permisos para consultar este usuario."));

            var result = await _userManagementService.GetByIdAsync(id);
            if (!result.Success)
                return NotFound(result);
            return Ok(result);
        }

        /// PUT /api/user/{id}/role
        [HttpPut("{id}/role")]
        public async Task<IActionResult> UpdateRole(string id, [FromBody] UpdateUserRoleDto request)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var canManage = await _userManagementService.UserHasPermissionAsync(userId, "roles.gestionar") ||
                            await _userManagementService.UserHasPermissionAsync(userId, "usuarios.gestionar");

            if (!canManage)
                return StatusCode(StatusCodes.Status403Forbidden, OperationResult.Fail("No tienes permisos para modificar roles de usuarios."));

            if (request == null || string.IsNullOrWhiteSpace(request.Role))
                return BadRequest(OperationResult.Fail("Rol no especificado"));

            var result = await _userManagementService.UpdateUserRoleAsync(id, request.Role);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }

        /// PUT /api/user/{id}/deactivate
        [HttpPut("{id}/deactivate")]
        public async Task<IActionResult> Deactivate(string id)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var canManage = await _userManagementService.UserHasPermissionAsync(userId, "usuarios.gestionar");
            if (!canManage)
                return StatusCode(StatusCodes.Status403Forbidden, OperationResult.Fail("No tienes permisos para desactivar usuarios."));

            var result = await _userManagementService.DeactivateAsync(id);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }

        /// PUT /api/user/{id}/activate
        [HttpPut("{id}/activate")]
        public async Task<IActionResult> Activate(string id)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var canManage = await _userManagementService.UserHasPermissionAsync(userId, "usuarios.gestionar");
            if (!canManage)
                return StatusCode(StatusCodes.Status403Forbidden, OperationResult.Fail("No tienes permisos para activar usuarios."));

            var result = await _userManagementService.ActivateAsync(id);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }

        /// DELETE /api/user/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var canManage = await _userManagementService.UserHasPermissionAsync(userId, "usuarios.gestionar");
            if (!canManage)
                return StatusCode(StatusCodes.Status403Forbidden, OperationResult.Fail("No tienes permisos para eliminar usuarios."));

            var result = await _userManagementService.DeleteAsync(id);
            if (!result.Success)
                return NotFound(result);
            return Ok(result);
        }
    }
}

