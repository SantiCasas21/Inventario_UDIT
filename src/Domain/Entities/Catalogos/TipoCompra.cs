namespace Domain.Entities.Catalogos
{
    public class TipoCompra
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;

        // Navigation property
        public ICollection<MovimientoInventario> Movimientos { get; set; } = new List<MovimientoInventario>();
    }
}
