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
    }
}
