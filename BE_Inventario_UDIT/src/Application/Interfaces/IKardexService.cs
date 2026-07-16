using Application.Common.Models;
using Application.DTOs;

namespace Application.Interfaces
{
    /// <summary>
    /// Servicio del Kardex — gestión de movimientos de inventario.
    /// </summary>
    public interface IKardexService
    {
        Task<OperationResult<MovimientoDto>> RegistrarIngresoAsync(MovimientoRequestDto request);
        Task<OperationResult<MovimientoDto>> RegistrarSalidaAsync(MovimientoRequestDto request);
        Task<OperationResult<MovimientoDto>> RegistrarAjusteAsync(MovimientoRequestDto request);
        Task<OperationResult<IEnumerable<MovimientoDto>>> GetMovimientosPorInsumoAsync(int insumoId, int? limite = null);
        Task<int> CalcularStockAsync(int insumoId);
        Task<IEnumerable<StockDto>> GetStockGeneralAsync();
        Task<OperationResult<StockDto>> GetStockPorInsumoAsync(int insumoId);
    }
}
