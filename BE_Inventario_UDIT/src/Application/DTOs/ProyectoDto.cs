namespace Application.DTOs
{
    /// <summary>
    /// DTO para Proyecto.
    /// </summary>
    public class ProyectoDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public int IdEstado { get; set; }
        public string EstadoNombre { get; set; } = string.Empty;
        public DateTime FechaCreacion { get; set; }
    }

    /// <summary>
    /// DTO para crear/actualizar un Proyecto.
    /// </summary>
    public class ProyectoRequestDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public int IdEstado { get; set; }
    }
}
