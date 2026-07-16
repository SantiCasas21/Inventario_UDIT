using Application.Common.Models;
using Application.DTOs;

namespace Application.Interfaces
{
    /// <summary>
    /// Servicio de proveedores con lógica de negocio.
    /// </summary>
    public interface IProveedorService
    {
        Task<OperationResult<IEnumerable<ProveedorFullDto>>> GetAllAsync();
        Task<OperationResult<ProveedorFullDto>> GetByIdAsync(int id);
        Task<OperationResult<ProveedorFullDto>> CreateAsync(ProveedorFullRequestDto request);
        Task<OperationResult<ProveedorFullDto>> UpdateAsync(int id, ProveedorFullRequestDto request);
        Task<OperationResult> DeleteAsync(int id);
    }
}
