using Domain.Entities.Catalogos;

namespace Domain.Entities
{
    public class Proyecto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Descripcion { get; set; }

        public int IdEstado { get; set; }
        public EstadoProyecto Estado { get; set; } = null!;

        public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

        // Navigation property
        public ICollection<MovimientoInventario> Movimientos { get; set; } = new List<MovimientoInventario>();
    }
}
