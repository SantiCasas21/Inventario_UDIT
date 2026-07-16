using Application.Common.Models;
using Application.DTOs;

namespace Application.Interfaces
{
    /// <summary>
    /// Servicio genérico para catálogos.
    /// </summary>
    public interface ICatalogoService<T> where T : class
    {
        Task<OperationResult<IEnumerable<CatalogoDto>>> GetAllAsync();
        Task<OperationResult<CatalogoDto>> GetByIdAsync(int id);
        Task<OperationResult<CatalogoDto>> CreateAsync(CatalogoRequestDto request);
        Task<OperationResult<CatalogoDto>> UpdateAsync(int id, CatalogoRequestDto request);
        Task<OperationResult> DeleteAsync(int id);
    }
}
