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
        public string? Moneda { get; set; }
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
        
        public int? IdUbicacion { get; set; }
        public string? UbicacionNombre { get; set; }
        
        public int? IdUbicacionAnterior { get; set; }
        public string? UbicacionAnteriorNombre { get; set; }
        
        public string? UsuarioRegistro { get; set; }

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
                    Domain.Enums.TipoMovimiento.Unificacion => "UNIFICAR",
                    Domain.Enums.TipoMovimiento.Traslado => "TRASLADO",
                    _ => "DESCONOCIDO"
                },
                Cantidad = m.Cantidad,
                Fecha = m.Fecha,
                PrecioUnitario = m.PrecioUnitario,
                Moneda = m.Moneda,
                Observacion = m.Observacion,
                IdProveedor = m.IdProveedor,
                ProveedorNombre = m.Proveedor?.Nombre,
                IdTipoCompra = m.IdTipoCompra,
                TipoCompraNombre = m.TipoCompra?.Nombre,
                IdProyecto = m.IdProyecto,
                ProyectoNombre = m.Proyecto?.Nombre,
                IdEstadoSalida = m.IdEstadoSalida,
                EstadoSalidaNombre = m.EstadoSalida?.Nombre,
                // Priorizar la ubicación del movimiento, si no tiene, usar nulo (ya no hay ubicación legacy en insumo)
                InsumoUbicacion = m.TipoMovimiento == Domain.Enums.TipoMovimiento.Unificacion
                    ? "Consolidación Global"
                    : m.Ubicacion?.Nombre ?? "Varias/Desconocida",
                IdUbicacion = m.IdUbicacion,
                UbicacionNombre = m.Ubicacion?.Nombre,
                IdUbicacionAnterior = m.IdUbicacionAnterior,
                UbicacionAnteriorNombre = m.UbicacionAnterior?.Nombre,
                UsuarioRegistro = m.UsuarioRegistro
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
        public string? Moneda { get; set; }
        public string? Observacion { get; set; }

        // Para INGRESO
        public int? IdProveedor { get; set; }
        public int? IdTipoCompra { get; set; }

        // Para SALIDA
        public int? IdProyecto { get; set; }
        public int? IdEstadoSalida { get; set; }

        // Para AJUSTE con cambio de ubicación (y ahora también para INGRESO opcional)
        // El sistema guardará esta ubicación en el Kardex y actualizará el Insumo principal.
        public int? IdNuevaUbicacion { get; set; }
        
        // Ubicación donde se registra el ingreso o de donde sale el stock
        public int? IdUbicacion { get; set; }
        
        // El usuario que realiza la operación (se suele sacar del token)
        public string? UsuarioRegistro { get; set; }
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
