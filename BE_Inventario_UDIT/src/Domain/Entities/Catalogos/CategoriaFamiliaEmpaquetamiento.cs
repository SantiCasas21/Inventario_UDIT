namespace Domain.Entities.Catalogos
{
    /// <summary>
    /// Tabla relacional Muchos-a-Muchos (N:M) entre CategoriaInsumo y
    /// FamiliaEmpaquetamiento. Determina qué familias de empaquetamiento
    /// son válidas para cada categoría de insumo.
    /// </summary>
    public class CategoriaFamiliaEmpaquetamiento
    {
        public int Id { get; set; }

        public int IdCategoria { get; set; }
        public CategoriaInsumo Categoria { get; set; } = null!;

        public int IdFamiliaEmpaquetamiento { get; set; }
        public FamiliaEmpaquetamiento FamiliaEmpaquetamiento { get; set; } = null!;
    }
}
