using Domain.Entities;
using Domain.Enums;

namespace Application.DTOs
{
    /// <summary>
    /// DTO para mostrar un movimiento del Kardex.
    /// Incluye todos los datos relacionados para que el frontend
    /// no tenga que hacer llamadas extra.
    /// </summary>
    public class MovimientoDto
    {
        public int Id { get; set; }
        public int IdInsumo { get; set; }
        public string CodigoFabrica { get; set; } = string.Empty;   // del Insumo
        public string TipoMovimiento { get; set; } = string.Empty;  // INGRESO, SALIDA, AJUSTE
        public int Cantidad { get; set; }
        public DateTime Fecha { get; set; }
        public decimal? PrecioUnitario { get; set; }
        public string? Observacion { get; set; }

        // Relaciones opcionales según el tipo
        public int? IdProveedor { get; set; }
        public string? ProveedorNombre { get; set; }
        public int? IdTipoCompra { get; set; }
        public string? TipoCompraNombre { get; set; }
        public int? IdProyecto { get; set; }
        public string? ProyectoNombre { get; set; }
        public int? IdEstadoSalida { get; set; }
        public string? EstadoSalidaNombre { get; set; }

        public string? InsumoUbicacion { get; set; }

        /// <summary>
        /// Factory method: mapea de entidad a DTO.
        /// Centralizado aquí para que KardexService y MovimientoController
        /// compartan la misma lógica de mapeo.
        /// </summary>
        public static MovimientoDto FromEntity(MovimientoInventario m)
        {
            return new MovimientoDto
            {
                Id = m.Id,
                IdInsumo = m.IdInsumo,
                CodigoFabrica = m.Insumo?.CodigoFabrica ?? "",
                TipoMovimiento = m.TipoMovimiento switch
                {
                    Domain.Enums.TipoMovimiento.Ingreso => "INGRESO",
                    Domain.Enums.TipoMovimiento.Salida => "SALIDA",
                    Domain.Enums.TipoMovimiento.Ajuste => "AJUSTE",
                    _ => "DESCONOCIDO"
                },
                Cantidad = m.Cantidad,
                Fecha = m.Fecha,
                PrecioUnitario = m.PrecioUnitario,
                Observacion = m.Observacion,
                IdProveedor = m.IdProveedor,
                ProveedorNombre = m.Proveedor?.Nombre,
                IdTipoCompra = m.IdTipoCompra,
                TipoCompraNombre = m.TipoCompra?.Nombre,
                IdProyecto = m.IdProyecto,
                ProyectoNombre = m.Proyecto?.Nombre,
                IdEstadoSalida = m.IdEstadoSalida,
                EstadoSalidaNombre = m.EstadoSalida?.Nombre,
                InsumoUbicacion = m.Insumo?.Ubicacion?.Nombre
            };
        }
    }

    /// <summary>
    /// DTO para registrar un nuevo movimiento.
    /// </summary>
    public class MovimientoRequestDto
    {
        public int IdInsumo { get; set; }
        public int Cantidad { get; set; }
        public decimal? PrecioUnitario { get; set; }
        public string? Observacion { get; set; }

        // Para INGRESO
        public int? IdProveedor { get; set; }
        public int? IdTipoCompra { get; set; }

        // Para SALIDA
        public int? IdProyecto { get; set; }
        public int? IdEstadoSalida { get; set; }
    }

    /// <summary>
    /// DTO para mostrar el stock calculado de un insumo.
    /// </summary>
    public class StockDto
    {
        public int IdInsumo { get; set; }
        public string CodigoFabrica { get; set; } = string.Empty;
        public string? Descripcion { get; set; }
        public int StockActual { get; set; }
        public int TotalIngresos { get; set; }
        public int TotalSalidas { get; set; }
    }
}
