using Microsoft.AspNetCore.Identity;

namespace Domain.Entities
{
    /// <summary>
    /// Usuario personalizado de la aplicación. Extiende IdentityUser
    /// para agregar campos propios del dominio UDIT.
    /// </summary>
    public class ApplicationUser : IdentityUser
    {
        /// <summary>Nombre completo del usuario</summary>
        public string NombreCompleto { get; set; } = string.Empty;

        /// <summary>Fecha de creación de la cuenta</summary>
        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        /// <summary>Si el usuario está activo (soft delete/disable)</summary>
        public bool Activo { get; set; } = true;

        /// <summary>Fecha en que el usuario fue desactivado (usado para purga automática tras 30 días)</summary>
        public DateTime? FechaDesactivacion { get; set; }

        /// <summary>URL o identificador del avatar del usuario</summary>
        public string? AvatarUrl { get; set; }

        /// <summary>Indica si el usuario debe cambiar su contraseña obligatoriamente en su primer inicio de sesión</summary>
        public bool DebeCambiarPassword { get; set; } = false;

        /// <summary>Navegación a roles del usuario — usada para cargar roles en JOIN sin N+1</summary>
        public virtual ICollection<IdentityUserRole<string>> UserRoles { get; set; } = new List<IdentityUserRole<string>>();
    }
}

