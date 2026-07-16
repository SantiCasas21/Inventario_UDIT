namespace Domain.Entities.Catalogos
{
    public class Empaquetamiento
    {
        public int Id { get; set; }
        public string Tipo { get; set; } = string.Empty;

        // Navigation property
        public ICollection<Insumo> Insumos { get; set; } = new List<Insumo>();
    }
}
