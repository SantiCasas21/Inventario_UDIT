namespace Application.DTOs
{
    /// <summary>
    /// DTO para solicitud de login.
    /// </summary>
    public class LoginRequestDto
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO para solicitud de registro (solo Admin).
    /// </summary>
    public class RegisterRequestDto
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string NombreCompleto { get; set; } = string.Empty;
        public string Role { get; set; } = "User"; // Admin, Developer, Assistant, User
    }

    /// <summary>
    /// DTO de respuesta con el token JWT y datos del usuario.
    /// </summary>
    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public DateTime Expiration { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string NombreCompleto { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public bool DebeCambiarPassword { get; set; }
        public List<string> Permissions { get; set; } = new();
    }

    /// <summary>
    /// DTO con la información del usuario actual.
    /// </summary>
    public class UserInfoDto
    {
        public string Id { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string NombreCompleto { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public bool DebeCambiarPassword { get; set; }
        public bool Activo { get; set; }
        public DateTime FechaCreacion { get; set; }
        public List<string> Permissions { get; set; } = new();
    }


    /// <summary>
    /// DTO para actualizar el perfil del usuario autenticado.
    /// </summary>
    public class UpdateProfileRequestDto
    {
        public string NombreCompleto { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
    }


    /// <summary>
    /// DTO para cambiar la contraseña del usuario autenticado.
    /// </summary>
    public class ChangePasswordRequestDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO para actualizar el rol de un usuario (solo Admin).
    /// </summary>
    public class UpdateUserRoleDto
    {
        public string Role { get; set; } = "User";
    }
}


