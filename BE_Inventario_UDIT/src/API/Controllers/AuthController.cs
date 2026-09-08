using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        /// <summary>
        /// Iniciar sesión. Devuelve token JWT.
        /// </summary>
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            if (request == null)
                return BadRequest(Application.Common.Models.OperationResult.Fail("Cuerpo de solicitud inválido"));

            var result = await _authService.LoginAsync(request);
            if (!result.Success)
                return Unauthorized(result);

            return Ok(result);
        }

        /// <summary>
        /// Registrar un nuevo usuario (público o administrativo). Por defecto rol User.
        /// </summary>
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDto request)
        {
            if (request == null)
                return BadRequest(Application.Common.Models.OperationResult.Fail("Cuerpo de solicitud inválido"));

            // Si el solicitante no es Admin autenticado, asegurar rol 'User'
            if (!User.IsInRole("Admin"))
            {
                request.Role = "User";
            }

            var result = await _authService.RegisterAsync(request);
            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        /// <summary>
        /// Obtener información del usuario autenticado.
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
                return Unauthorized(Application.Common.Models.OperationResult.Fail("No autenticado"));

            var result = await _authService.GetUserInfoAsync(userId);
            if (!result.Success)
                return NotFound(result);

            return Ok(result);
        }

        /// <summary>
        /// Actualizar datos del perfil (nombre completo, usuario, avatar) del usuario actual.
        /// </summary>
        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequestDto request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
                return Unauthorized(Application.Common.Models.OperationResult.Fail("No autenticado"));

            if (request == null)
                return BadRequest(Application.Common.Models.OperationResult.Fail("Cuerpo de solicitud inválido"));

            var result = await _authService.UpdateProfileAsync(userId, request);
            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }

        /// <summary>
        /// Cambiar la contraseña del usuario actual.
        /// </summary>
        [HttpPut("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDto request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
                return Unauthorized(Application.Common.Models.OperationResult.Fail("No autenticado"));

            if (request == null)
                return BadRequest(Application.Common.Models.OperationResult.Fail("Cuerpo de solicitud inválido"));

            var result = await _authService.ChangePasswordAsync(userId, request);
            if (!result.Success)
                return BadRequest(result);

            return Ok(result);
        }
    }
}

