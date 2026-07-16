using Domain.Entities.Catalogos;
using Domain.Enums;

namespace Domain.Entities
{
    /// <summary>
    /// Corazón del sistema de inventario (Kardex).
    /// Cada movimiento registra una entrada, salida o ajuste de un insumo.
    /// El stock disponible de cada insumo se calcula sumando Ingresos
    /// y restando Salidas sobre todos sus movimientos.
    /// </summary>
    public class MovimientoInventario
    {
        public int Id { get; set; }

        // Insumo afectado (obligatorio)
        public int IdInsumo { get; set; }
        public Insumo Insumo { get; set; } = null!;

        /// <summary>
        /// Tipo de movimiento: "Ingreso", "Salida" o "Ajuste"
        /// </summary>
        public TipoMovimiento TipoMovimiento { get; set; }

        /// <summary>
        /// Cantidad del movimiento.
        /// - Ingreso y Salida: siempre positivo (el TipoMovimiento define incremento/decremento).
        /// - Ajuste: puede ser positivo (aumenta stock) o negativo (reduce stock).
        /// </summary>
        public int Cantidad { get; set; }

        /// <summary>
        /// Fecha y hora en que se registró el movimiento.
        /// </summary>
        public DateTime Fecha { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Precio unitario del insumo en el momento del movimiento.
        /// </summary>
        public decimal? PrecioUnitario { get; set; }

        /// <summary>
        /// Observación opcional sobre el movimiento.
        /// </summary>
        public string? Observacion { get; set; }

        // ==========================================
        // Relaciones opcionales (dependen del tipo)
        // ==========================================

        // Ingreso: quién proveyó y bajo qué tipo de compra
        public int? IdProveedor { get; set; }
        public Proveedor? Proveedor { get; set; }

        public int? IdTipoCompra { get; set; }
        public TipoCompra? TipoCompra { get; set; }

        // Salida: a qué proyecto y con qué estado de salida
        public int? IdProyecto { get; set; }
        public Proyecto? Proyecto { get; set; }

        public int? IdEstadoSalida { get; set; }
        public EstadoSalida? EstadoSalida { get; set; }
    }
}
