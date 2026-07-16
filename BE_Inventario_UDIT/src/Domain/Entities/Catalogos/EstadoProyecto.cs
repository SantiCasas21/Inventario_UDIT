namespace Domain.Entities.Catalogos
{
    public class EstadoProyecto
    {
        public int Id { get; set; }
        public string Estado { get; set; } = string.Empty;

        // Navigation property
        public ICollection<Proyecto> Proyectos { get; set; } = new List<Proyecto>();
    }
}
