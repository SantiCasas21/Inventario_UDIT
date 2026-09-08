using System.Collections.Generic;

namespace Application.DTOs
{
    /// <summary>
    /// Fila individual previsualizada y cruzada con la base de datos para la importación.
    /// </summary>
    public class IngresoPreviewItemDto
    {
        public int Fila { get; set; }
        public string CodigoFabrica { get; set; } = string.Empty;
        public bool InsumoExiste { get; set; }
        public int? IdInsumo { get; set; }
        public string? Descripcion { get; set; }
        public int Cantidad { get; set; }
        public decimal? PrecioUnitario { get; set; }
        
        // Categoría para autocompletado en creación
        public int? IdCategoria { get; set; }
        public string? CategoriaNombre { get; set; }
        public string? CategoriaTextoExcel { get; set; }
        public bool CategoriaExiste { get; set; } = true;

        // Empaquetamiento para autocompletado en creación
        public int? IdEmpaquetamiento { get; set; }
        public string? EmpaquetamientoNombre { get; set; }
        public string? EmpaquetamientoTextoExcel { get; set; }
        public bool EmpaquetamientoExiste { get; set; } = true;

        // Medidas
        public decimal? ValorMedida { get; set; }
        public string? UnidadMedida { get; set; }

        // Ubicaciones
        public int? IdUbicacion { get; set; }
        public string? UbicacionNombre { get; set; }
        public List<StockUbicacionDto> UbicacionesDisponibles { get; set; } = new();

        // Proveedor
        public int? IdProveedor { get; set; }
        public string? ProveedorNombre { get; set; }
        public string? ProveedorTextoExcel { get; set; }
        public bool ProveedorExiste { get; set; } = true;

        // Tipo de compra
        public int? IdTipoCompra { get; set; }
        public string? TipoCompraNombre { get; set; }
        public string? TipoCompraTextoExcel { get; set; }
        public bool TipoCompraExiste { get; set; } = true;

        // Observación y Control
        public string? Observacion { get; set; }
        public bool EsDuplicadoEnLote { get; set; }
        public string EstadoValidacion { get; set; } = "OK"; // "OK", "REQUIERE_UBICACION", "INSUMO_NO_REGISTRADO", "PROVEEDOR_NO_REGISTRADO", "CATEGORIA_NO_REGISTRADA", "EMPAQUETAMIENTO_NO_REGISTRADO", "CANTIDAD_INVALIDA"
        public string? MensajeError { get; set; }
    }

    /// <summary>
    /// Respuesta completa de la previsualización del archivo Excel.
    /// </summary>
    public class IngresoPreviewResponseDto
    {
        public int TotalFilas { get; set; }
        public int TotalValidas { get; set; }
        public int TotalInsumosNuevos { get; set; }
        public int TotalProveedoresNuevos { get; set; }
        public int TotalCategoriasNuevas { get; set; }
        public int TotalEmpaquetamientosNuevos { get; set; }
        public int TotalDuplicados { get; set; }
        public decimal TotalInversionEstimada { get; set; }
        public List<IngresoPreviewItemDto> Filas { get; set; } = new();
    }

    /// <summary>
    /// Solicitud de ingreso masivo de múltiples insumos validados.
    /// </summary>
    public class IngresoMasivoRequestDto
    {
        public List<MovimientoRequestDto> Movimientos { get; set; } = new();
    }

    /// <summary>
    /// Resultado consolidado del ingreso masivo.
    /// </summary>
    public class IngresoMasivoResultDto
    {
        public int TotalProcesados { get; set; }
        public decimal TotalInvertido { get; set; }
        public List<MovimientoDto> MovimientosCreados { get; set; } = new();
        public List<string> Errores { get; set; } = new();
    }
}
