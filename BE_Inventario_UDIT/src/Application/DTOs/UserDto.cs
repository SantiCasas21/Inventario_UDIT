namespace Application.DTOs
{
    /// <summary>
    /// DTO para gestionar usuarios del sistema (AspNetUsers).
    /// Incluye el rol asignado y estado activo/inactivo.
    /// </summary>
    public class UserDto
    {
        public string Id { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string NombreCompleto { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public bool Activo { get; set; }
        public bool DebeCambiarPassword { get; set; }
        public DateTime? FechaDesactivacion { get; set; }
        public int? DiasRestantesEliminacion { get; set; }
        public DateTime FechaCreacion { get; set; }
    }

    /// <summary>
    /// DTO para la creación de un nuevo usuario por parte del Administrador.
    /// </summary>
    public class CreateUserAdminDto
    {
        public string NombreCompleto { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = "User";
    }

    /// <summary>
    /// DTO para la solicitud de restablecimiento administrativo de contraseña temporal.
    /// </summary>
    public class ResetUserPasswordAdminDto
    {
        public string? NewTemporaryPassword { get; set; }
        public bool AutoGenerate { get; set; } = true;
    }

    /// <summary>
    /// DTO con la respuesta del restablecimiento de contraseña temporal.
    /// </summary>
    public class ResetPasswordResponseDto
    {
        public string UserId { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string TemporaryPassword { get; set; } = string.Empty;
        public bool DebeCambiarPassword { get; set; } = true;
    }
}



