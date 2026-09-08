namespace Application.DTOs
{
    /// <summary>
    /// DTO que representa un rol con su lista de permisos (claims) asignados.
    /// </summary>
    public class RolePermissionsDto
    {
        /// <summary>Nombre del rol (Admin, Developer, Assistant, User)</summary>
        public string RoleName { get; set; } = string.Empty;

        /// <summary>Lista de valores de permisos asignados al rol (ej: "insumos.ver")</summary>
        public List<string> Permissions { get; set; } = new();
    }

    /// <summary>
    /// DTO para actualizar los permisos de un rol. Reemplaza todos los permisos existentes.
    /// </summary>
    public class UpdatePermissionsRequestDto
    {
        /// <summary>Lista completa de permisos que debe tener el rol después del update.</summary>
        public List<string> Permissions { get; set; } = new();
    }

    /// <summary>
    /// Define un permiso disponible en el sistema, con metadata para la UI.
    /// </summary>
    public class PermissionDefinitionDto
    {
        /// <summary>Valor único del permiso (ej: "insumos.ver")</summary>
        public string Value { get; set; } = string.Empty;

        /// <summary>Etiqueta legible para el usuario (ej: "Ver Insumos")</summary>
        public string Label { get; set; } = string.Empty;

        /// <summary>Módulo al que pertenece el permiso (ej: "Insumos")</summary>
        public string Module { get; set; } = string.Empty;

        /// <summary>Descripción detallada del permiso</summary>
        public string Description { get; set; } = string.Empty;
    }
}
