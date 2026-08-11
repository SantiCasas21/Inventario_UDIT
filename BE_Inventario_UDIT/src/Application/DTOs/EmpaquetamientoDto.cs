namespace Application.DTOs
{
    /// <summary>
    /// DTO de Empaquetamiento con información de su familia.
    /// </summary>
    public class EmpaquetamientoDto
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = string.Empty;
        public string Tipo { get; set; } = string.Empty;
        public int? IdFamiliaEmpaquetamiento { get; set; }
        public string? FamiliaEmpaquetamientoNombre { get; set; }
    }

    /// <summary>
    /// DTO para crear/actualizar un Empaquetamiento.
    /// Si IdFamiliaEmpaquetamiento es null, el servicio lo clasifica automáticamente
    /// según las reglas de patrones del nombre.
    /// </summary>
    public class EmpaquetamientoRequestDto
    {
        public string Nombre { get; set; } = string.Empty;
        public int? IdFamiliaEmpaquetamiento { get; set; }
    }
}
