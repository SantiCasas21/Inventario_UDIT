using Domain.Entities;

namespace Application.DTOs
{
    /// <summary>
    /// DTO para Insumo — incluye los nombres de los catálogos relacionados
    /// para evitar que el frontend tenga que hacer múltiples llamadas.
    /// </summary>
    public class InsumoDto
    {
        public int Id { get; set; }
        public int IdCategoria { get; set; }
        public string CategoriaNombre { get; set; } = string.Empty;
        public string CodigoFabrica { get; set; } = string.Empty;
        public int IdEmpaquetamiento { get; set; }
        public string EmpaquetamientoNombre { get; set; } = string.Empty;
        
        // Ubicaciones y stock dinámico
        public List<StockUbicacionDto> UbicacionesStock { get; set; } = new List<StockUbicacionDto>();
        public int Cantidad { get; set; } // Stock Total

        public string? Descripcion { get; set; }
        public decimal? PrecioReferencia { get; set; }
        public string? Moneda { get; set; }
        public decimal? ValorMedida { get; set; }
        public string? UnidadMedida { get; set; }
    }

    /// <summary>
    /// DTO para crear/actualizar un Insumo.
    /// </summary>
    public class InsumoRequestDto
    {
        public int IdCategoria { get; set; }
        public string CodigoFabrica { get; set; } = string.Empty;
        public int IdEmpaquetamiento { get; set; }
        public string? Descripcion { get; set; }
        public decimal? PrecioReferencia { get; set; }
        public string? Moneda { get; set; }
        public decimal? ValorMedida { get; set; }
        public string? UnidadMedida { get; set; }
    }

    /// <summary>
    /// DTO para el stock de un insumo en una ubicación específica.
    /// </summary>
    public class StockUbicacionDto
    {
        public int IdUbicacion { get; set; }
        public string UbicacionNombre { get; set; } = string.Empty;
        public int Stock { get; set; }
    }
}
