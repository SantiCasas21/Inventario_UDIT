namespace Application.DTOs
{
    /// <summary>
    /// DTO genérico para todos los catálogos.
    /// CategoriaInsumo, Empaquetamiento, Ubicacion, TipoCompra,
    /// EstadoSalida, EstadoProyecto, Proveedor — TODOS usan esto.
    /// </summary>
    public class CatalogoDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;

        // El nombre de la entidad a la que pertenece (para saber
        // si esto es una categoría, un empaquetamiento, etc.)
        public string Tipo { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO para crear o actualizar un catálogo (sin Id).
    /// </summary>
    public class CatalogoRequestDto
    {
        public string Nombre { get; set; } = string.Empty;
    }
}
