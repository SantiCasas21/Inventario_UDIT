namespace Application.DTOs
{
    /// <summary>
    /// Filtro compuesto para Movimientos (Kardex).
    /// Todos los campos son opcionales. Se combinan con AND.
    /// </summary>
    public class MovimientoFilterDto
    {
        // ==========================================
        // Multi-select
        // ==========================================
        /// <summary>Filtrar por tipos de movimiento: "INGRESO","SALIDA","AJUSTE"</summary>
        public List<string>? TiposMovimiento { get; set; }

        /// <summary>Filtrar por uno o varios insumos (IDs)</summary>
        public List<int>? IdsInsumo { get; set; }

        /// <summary>Filtrar por uno o varios proveedores (IDs)</summary>
        public List<int>? IdsProveedor { get; set; }

        /// <summary>Filtrar por uno o varios proyectos (IDs)</summary>
        public List<int>? IdsProyecto { get; set; }

        /// <summary>Filtrar por uno o varios tipos de compra (IDs)</summary>
        public List<int>? IdsTipoCompra { get; set; }

        /// <summary>Filtrar por uno o varios estados de salida (IDs)</summary>
        public List<int>? IdsEstadoSalida { get; set; }

        // ==========================================
        // Rangos
        // ==========================================
        public int? CantidadMin { get; set; }
        public int? CantidadMax { get; set; }
        public decimal? PrecioUnitarioMin { get; set; }
        public decimal? PrecioUnitarioMax { get; set; }
        public DateTime? FechaDesde { get; set; }
        public DateTime? FechaHasta { get; set; }

        // ==========================================
        // Búsqueda textual
        // ==========================================
        /// <summary>Búsqueda en Observación (contiene)</summary>
        public string? TextSearch { get; set; }

        // ==========================================
        // Paginación
        // ==========================================
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;

        // ==========================================
        // Ordenamiento
        // ==========================================
        /// <summary>
        /// Campo por el cual ordenar:
        /// "Fecha", "Cantidad", "PrecioUnitario", "Insumo", "TipoMovimiento"
        /// </summary>
        public string? SortBy { get; set; }

        public bool SortDescending { get; set; }
    }
}
