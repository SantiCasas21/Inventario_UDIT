using Application.Common.Models;
using Application.DTOs;

namespace Application.Interfaces
{
    /// <summary>
    /// Servicio de insumos con lógica de negocio.
    /// </summary>
    public interface IInsumoService
    {
        Task<OperationResult<PagedResult<InsumoDto>>> GetAllAsync(InsumoFilterDto? filter = null);
        Task<OperationResult<InsumoDto>> GetByIdAsync(int id);
        Task<OperationResult<InsumoDto>> CreateAsync(InsumoRequestDto request);
        Task<OperationResult<InsumoDto>> UpdateAsync(int id, InsumoRequestDto request);
        Task<OperationResult> DeleteAsync(int id);
    }
}
