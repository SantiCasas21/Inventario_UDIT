namespace Domain.Entities.Catalogos
{
    public class EstadoSalida
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;

        // Navigation property
        public ICollection<MovimientoInventario> Movimientos { get; set; } = new List<MovimientoInventario>();
    }
}
