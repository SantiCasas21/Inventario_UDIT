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
    }
}
