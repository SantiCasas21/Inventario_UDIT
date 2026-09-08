namespace Application.DTOs
{
    /// <summary>
    /// DTO para el Kardex detallado de un insumo.
    /// Muestra cada movimiento con el SALDO ACUMULADO después de cada transacción.
    /// </summary>
    public class KardexDetalladoDto
    {
        public int IdMovimiento { get; set; }
        public DateTime Fecha { get; set; }
        public string TipoMovimiento { get; set; } = string.Empty;
        public int Cantidad { get; set; }
        public string? Observacion { get; set; }
        public string? Proveedor { get; set; }
        public string? Proyecto { get; set; }
        public string? Ubicacion { get; set; }

        /// <summary>Saldo después de este movimiento</summary>
        public int SaldoAcumulado { get; set; }
    }

    /// <summary>
    /// DTO para reporte de stock crítico (insumos por debajo del umbral).
    /// </summary>
    public class StockCriticoDto
    {
        public int IdInsumo { get; set; }
        public string CodigoFabrica { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public string Categoria { get; set; } = string.Empty;
        public string Ubicacion { get; set; } = string.Empty;
        public int StockActual { get; set; }
        public int Umbral { get; set; }
    }

    /// <summary>
    /// DTO para resumen de movimientos en un período.
    /// </summary>
    public class MovimientosPeriodoDto
    {
        public int TotalIngresos { get; set; }
        public int TotalSalidas { get; set; }
        public int TotalAjustes { get; set; }
        public int CantidadIngresada { get; set; }
        public int CantidadSalida { get; set; }
        public List<MovimientoDto> Movimientos { get; set; } = new();
    }

    /// <summary>
    /// DTO para resumen por proyecto (cuánto se gastó y consumió de cada insumo).
    /// </summary>
    public class ResumenProyectoDto
    {
        public int IdProyecto { get; set; }
        public string ProyectoNombre { get; set; } = string.Empty;
        public string EstadoNombre { get; set; } = string.Empty;
        public bool EsCostoFijo { get; set; }
        public int TotalMovimientos { get; set; }
        public int TotalUnidadesRetiradas { get; set; }
        public decimal CostoTotalProyecto { get; set; }
        public string Moneda { get; set; } = "COP";
        public List<InsumoResumenDto> Insumos { get; set; } = new();
    }

    public class InsumoResumenDto
    {
        public int IdInsumo { get; set; }
        public string CodigoFabrica { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public int CantidadRetirada { get; set; }
        public decimal PrecioUnitarioPromedio { get; set; }
        public decimal CostoTotal { get; set; }
    }
}
