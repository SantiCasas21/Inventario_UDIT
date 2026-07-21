namespace Application.DTOs
{
    /// <summary>
    /// DTO para el Dashboard principal.
    /// Muestra las métricas clave del inventario en una sola llamada.
    /// </summary>
    public class DashboardDto
    {
        // Totales
        public int TotalInsumos { get; set; }
        public int TotalProyectos { get; set; }
        public int TotalProveedores { get; set; }
        public int TotalMovimientos { get; set; }

        // Movimientos recientes
        public int MovimientosHoy { get; set; }
        public int MovimientosEsteMes { get; set; }
        public int IngresosHoy { get; set; }
        public int SalidasHoy { get; set; }

        // Stock
        public int StockBajoCount { get; set; }
        public List<StockCriticoDto> StockBajo { get; set; } = new();

        // Últimos movimientos
        public List<MovimientoDto> UltimosMovimientos { get; set; } = new();

        // Irregularidades detectadas
        public List<IrregularidadDto> Irregularidades { get; set; } = new();
    }

    /// <summary>
    /// DTO para una irregularidad o anomalía detectada en el inventario.
    /// </summary>
    public class IrregularidadDto
    {
        public string Tipo { get; set; } = "";
        public string Descripcion { get; set; } = "";
        public string? InsumoRef { get; set; }
        public string Severidad { get; set; } = "info"; // "alta", "media", "info"
    }
}
