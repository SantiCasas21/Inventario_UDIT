using Application.Common.Models;
using Application.DTOs;

namespace Application.Interfaces
{
    /// <summary>
    /// Servicio de reportes y analíticas.
    /// </summary>
    public interface IReporteService
    {
        Task<OperationResult<List<KardexDetalladoDto>>> GetKardexDetalladoAsync(int insumoId, DateTime? desde = null, DateTime? hasta = null);
        Task<OperationResult<List<StockCriticoDto>>> GetStockCriticoAsync(int umbral = 10);
        Task<OperationResult<MovimientosPeriodoDto>> GetMovimientosPorPeriodoAsync(DateTime desde, DateTime hasta, int? insumoId = null);
        Task<OperationResult<List<ResumenProyectoDto>>> GetResumenPorProyectoAsync(int? proyectoId = null);
        Task<OperationResult<DashboardDto>> GetDashboardAsync();
    }
}
