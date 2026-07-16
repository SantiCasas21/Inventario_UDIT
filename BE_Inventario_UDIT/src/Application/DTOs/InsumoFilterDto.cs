namespace Application.DTOs
{
    /// <summary>
    /// Filtro compuesto para Insumos estilo catálogo paramétrico.
    /// Todos los campos son opcionales. Se combinan con AND.
    /// Uso desde query string: GET /api/insumo/filter?idsCategoria=1&idsCategoria=2&precioMin=100
    /// Uso desde JSON: POST /api/insumo/filter
    /// </summary>
    public class InsumoFilterDto
    {
        // ==========================================
        // Multi-select de catálogos
        // ==========================================
        /// <summary>Filtrar por una o varias categorías (IDs)</summary>
        public List<int>? IdsCategoria { get; set; }

        /// <summary>Filtrar por uno o varios empaquetamientos (IDs)</summary>
        public List<int>? IdsEmpaquetamiento { get; set; }

        /// <summary>Filtrar por una o varias ubicaciones (IDs)</summary>
        public List<int>? IdsUbicacion { get; set; }

        // ==========================================
        // Rangos
        // ==========================================
        /// <summary>Precio de referencia mínimo (inclusive)</summary>
        public decimal? PrecioMin { get; set; }

        /// <summary>Precio de referencia máximo (inclusive)</summary>
        public decimal? PrecioMax { get; set; }

        // ==========================================
        // Búsqueda textual
        // ==========================================
        /// <summary>
        /// Búsqueda en CódigoFabrica y Descripción (OR).
        /// Coincidencia parcial (contiene).
        /// </summary>
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
        /// "CodigoFabrica", "Descripcion", "PrecioReferencia",
        /// "Categoria", "Empaquetamiento", "Ubicacion"
        /// </summary>
        public string? SortBy { get; set; }

        public bool SortDescending { get; set; }
    }
}
