using Application.Common.Models;
using Application.DTOs;

namespace Application.Interfaces
{
    /// <summary>
    /// Servicio de proyectos con lógica de negocio.
    /// </summary>
    public interface IProyectoService
    {
        Task<OperationResult<IEnumerable<ProyectoDto>>> GetAllAsync();
        Task<OperationResult<ProyectoDto>> GetByIdAsync(int id);
        Task<OperationResult<ProyectoDto>> CreateAsync(ProyectoRequestDto request);
        Task<OperationResult<ProyectoDto>> UpdateAsync(int id, ProyectoRequestDto request);
        Task<OperationResult> DeleteAsync(int id);
    }
}
