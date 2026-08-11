using Domain.Entities.Catalogos;

namespace Domain.Entities
{
    /// <summary>
    /// Representa un insumo en el inventario.
    /// NOTA: Esta entidad ya no contiene stock fijo (no hay columna Cantidad).
    /// El stock actual se calcula dinámicamente mediante la suma/resta de
    /// los movimientos del Kardex (MovimientoInventario).
    /// </summary>
    public class Insumo
    {
        public int Id { get; set; }

        // Relaciones a catálogos
        public int IdCategoria { get; set; }
        public CategoriaInsumo Categoria { get; set; } = null!;

        public string CodigoFabrica { get; set; } = string.Empty;

        public int IdEmpaquetamiento { get; set; }
        public Empaquetamiento Empaquetamiento { get; set; } = null!;

        public string? Descripcion { get; set; }

        public decimal? PrecioReferencia { get; set; }
        public string? Moneda { get; set; } = "COP";

        public decimal? ValorMedida { get; set; }
        public string? UnidadMedida { get; set; }

        // Navigation property al Kardex
        public ICollection<MovimientoInventario> Movimientos { get; set; } = new List<MovimientoInventario>();
    }
}
