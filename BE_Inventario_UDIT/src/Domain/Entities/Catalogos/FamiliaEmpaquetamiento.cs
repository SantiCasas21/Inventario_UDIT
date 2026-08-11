namespace Domain.Entities.Catalogos
{
    /// <summary>
    /// Familia de empaquetamiento (catálogo de 5 filas):
    /// Pasivos SMD, THT General, Discretos y Potencia,
    /// ICs y Microcontroladores, Genéricos y Otros.
    /// Permite filtrar empaquetamientos según la categoría del insumo.
    /// </summary>
    public class FamiliaEmpaquetamiento
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;

        // Relación N:M con CategoriaInsumo vía tabla intermedia
        public ICollection<CategoriaFamiliaEmpaquetamiento> CategoriaFamilias { get; set; } = new List<CategoriaFamiliaEmpaquetamiento>();

        // Relación 1:N con Empaquetamiento
        public ICollection<Empaquetamiento> Empaquetamientos { get; set; } = new List<Empaquetamiento>();
    }
}
