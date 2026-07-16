namespace Application.DTOs
{
    /// <summary>
    /// DTO completo para Proveedor con todos sus campos.
    /// A diferencia de CatalogoDto, este incluye Contacto y Direccion.
    /// </summary>
    public class ProveedorFullDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string? Contacto { get; set; }
        public string? Direccion { get; set; }
    }

    public class ProveedorFullRequestDto
    {
        public string Nombre { get; set; } = string.Empty;
        public string? Contacto { get; set; }
        public string? Direccion { get; set; }
    }
}
