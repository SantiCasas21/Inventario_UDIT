namespace Domain.Entities.Catalogos
{
    public class UnidadMedida
    {
        public int Id { get; set; }
        
        // Nombre o sigla de la unidad (ej. "OHM", "µF", "V", "mA")
        public string Nombre { get; set; } = string.Empty;

        // Categoría a la que pertenece esta unidad de medida
        public int IdCategoria { get; set; }
        public CategoriaInsumo Categoria { get; set; } = null!;
    }
}
