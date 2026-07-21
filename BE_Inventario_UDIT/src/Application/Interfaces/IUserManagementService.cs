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
        Task<OperationResult<IEnumerable<UserDto>>> GetAllAsync();
        Task<OperationResult<UserDto>> GetByIdAsync(string id);
        Task<OperationResult> DeactivateAsync(string id);
        Task<OperationResult> ActivateAsync(string id);
        Task<OperationResult> DeleteAsync(string id);
    }
}
