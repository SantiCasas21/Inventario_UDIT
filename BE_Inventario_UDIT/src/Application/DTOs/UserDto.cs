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
}



