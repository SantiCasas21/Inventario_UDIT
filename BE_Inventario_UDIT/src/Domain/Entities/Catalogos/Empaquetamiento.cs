namespace Domain.Entities.Catalogos
{
    public class Empaquetamiento
    {
        public int Id { get; set; }
        public string Tipo { get; set; } = string.Empty;

        // Familia a la que pertenece (nullable para migración segura;
        // los nuevos siempre reciben familia vía el clasificador)
        public int? IdFamiliaEmpaquetamiento { get; set; }
        public FamiliaEmpaquetamiento? FamiliaEmpaquetamiento { get; set; }

        // Navigation property
        public ICollection<Insumo> Insumos { get; set; } = new List<Insumo>();
    }
}
