using Application.Common.Models;
using Application.DTOs;

namespace Application.Interfaces
{
    /// <summary>
    /// Servicio de autenticación y gestión de usuarios.
    /// </summary>
    public interface IAuthService
    {
        /// <summary>Autentica un usuario y devuelve un token JWT</summary>
        Task<OperationResult<LoginResponseDto>> LoginAsync(LoginRequestDto request);

        /// <summary>Registra un nuevo usuario (solo Admin)</summary>
        Task<OperationResult<LoginResponseDto>> RegisterAsync(RegisterRequestDto request);

        /// <summary>Obtiene la información del usuario actual</summary>
        Task<OperationResult<UserInfoDto>> GetUserInfoAsync(string userId);
    }
}
