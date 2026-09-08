namespace Application.DTOs
{
    public class AuditoriaDto
    {
        public int Id { get; set; }
        public DateTime Fecha { get; set; }
        public string Usuario { get; set; } = string.Empty;
        public string? Rol { get; set; }
        public string? AvatarUrl { get; set; }
        public string Accion { get; set; } = string.Empty;
        public string Modulo { get; set; } = string.Empty;
        public string Detalles { get; set; } = string.Empty;
    }
}

