using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    /// <summary>
    /// Endpoints para la gestión RBAC: consulta y edición de permisos por rol.
    /// Solo accesible para usuarios con rol Admin.
    /// </summary>
    [ApiController]
    [Route("api/roles")]
    [Authorize(Roles = "Admin")]
    public class RoleController : ControllerBase
    {
        private readonly IUserManagementService _userManagementService;

        public RoleController(IUserManagementService userManagementService)
        {
            _userManagementService = userManagementService;
        }

        /// <summary>
        /// GET /api/roles/available-permissions
        /// Retorna el catálogo completo de permisos disponibles en el sistema.
        /// La UI lo usa para construir la tabla de checkboxes.
        /// </summary>
        [HttpGet("available-permissions")]
        public IActionResult GetAvailablePermissions()
        {
            var permissions = _userManagementService.GetAvailablePermissions();
            return Ok(OperationResult<IEnumerable<PermissionDefinitionDto>>.Ok(permissions));
        }

        /// <summary>
        /// GET /api/roles
        /// Retorna todos los roles del sistema junto con sus permisos asignados.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllRolesPermissions()
        {
            var result = await _userManagementService.GetAllRolesPermissionsAsync();
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }

        /// <summary>
        /// GET /api/roles/{roleName}/permissions
        /// Retorna los permisos asignados a un rol específico.
        /// </summary>
        [HttpGet("{roleName}/permissions")]
        public async Task<IActionResult> GetRolePermissions(string roleName)
        {
            var result = await _userManagementService.GetRolePermissionsAsync(roleName);
            if (!result.Success)
                return NotFound(result);
            return Ok(result);
        }

        /// <summary>
        /// PUT /api/roles/{roleName}/permissions
        /// Reemplaza los permisos de un rol con la lista provista.
        /// El rol Admin no puede ser modificado (retorna 400).
        /// </summary>
        [HttpPut("{roleName}/permissions")]
        public async Task<IActionResult> UpdateRolePermissions(
            string roleName,
            [FromBody] UpdatePermissionsRequestDto request)
        {
            if (request == null || request.Permissions == null)
                return BadRequest(OperationResult.Fail("La lista de permisos es requerida."));


            var result = await _userManagementService.UpdateRolePermissionsAsync(roleName, request.Permissions);
            if (!result.Success)
                return BadRequest(result);
            return Ok(result);
        }
    }
}
