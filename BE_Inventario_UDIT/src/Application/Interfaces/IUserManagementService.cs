using Application.Common.Models;
using Application.DTOs;

namespace Application.Interfaces
{
    /// <summary>
    /// Servicio de administración de usuarios del sistema.
    /// Solo accessible para usuarios con rol Admin.
    /// </summary>
    public interface IUserManagementService
    {
        // ── Gestión de usuarios ──────────────────────────────────────────────
        Task<OperationResult<IEnumerable<UserDto>>> GetAllAsync();
        Task<OperationResult<UserDto>> GetByIdAsync(string id);
        Task<OperationResult<UserDto>> CreateUserAsync(CreateUserAdminDto request, string? creatorUsername = null);
        Task<OperationResult> UpdateUserRoleAsync(string id, string newRole);
        Task<OperationResult> DeactivateAsync(string id);
        Task<OperationResult> ActivateAsync(string id);
        Task<OperationResult> DeleteAsync(string id);



        // ── RBAC: Gestión de roles y permisos ───────────────────────────────

        /// <summary>
        /// Retorna todos los roles del sistema con sus permisos (claims) asignados.
        /// </summary>
        Task<OperationResult<IEnumerable<RolePermissionsDto>>> GetAllRolesPermissionsAsync();

        /// <summary>
        /// Retorna los permisos asignados a un rol específico.
        /// </summary>
        Task<OperationResult<RolePermissionsDto>> GetRolePermissionsAsync(string roleName);

        /// <summary>
        /// Reemplaza todos los permisos de un rol con la lista provista.
        /// Operación atómica: borra los claims existentes e inserta los nuevos.
        /// </summary>
        Task<OperationResult> UpdateRolePermissionsAsync(string roleName, IEnumerable<string> permissions);

        /// <summary>
        /// Retorna el catálogo completo de permisos disponibles en el sistema (para la UI).
        /// </summary>
        IEnumerable<PermissionDefinitionDto> GetAvailablePermissions();

        /// <summary>
        /// Verifica si un usuario tiene un permiso específico (o si es Admin).
        /// </summary>
        Task<bool> UserHasPermissionAsync(string userId, string permission);
    }
}


