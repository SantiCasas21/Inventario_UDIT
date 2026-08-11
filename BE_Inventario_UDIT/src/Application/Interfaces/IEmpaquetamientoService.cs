using Application.Common.Models;
using Application.DTOs;

namespace Application.Interfaces
{
    /// <summary>
    /// Servicio dedicado de Empaquetamiento con clasificación inteligente
    /// de familias y filtrado por categoría.
    /// </summary>
    public interface IEmpaquetamientoService
    {
        Task<OperationResult<IEnumerable<EmpaquetamientoDto>>> GetAllAsync();
        Task<OperationResult<EmpaquetamientoDto>> GetByIdAsync(int id);
        Task<OperationResult<EmpaquetamientoDto>> CreateAsync(EmpaquetamientoRequestDto request);
        Task<OperationResult<EmpaquetamientoDto>> UpdateAsync(int id, EmpaquetamientoRequestDto request);
        Task<OperationResult> DeleteAsync(int id);

        /// <summary>
        /// Retorna los empaquetamientos válidos para una categoría
        /// (aquellos cuya familia está vinculada a la categoría).
        /// </summary>
        Task<OperationResult<IEnumerable<EmpaquetamientoDto>>> GetPorCategoriaAsync(int idCategoria);

        /// <summary>
        /// Retorna los empaquetamientos válidos para múltiples categorías.
        /// </summary>
        Task<OperationResult<IEnumerable<EmpaquetamientoDto>>> GetPorCategoriasAsync(int[] idsCategoria);

        /// <summary>
        /// Clasifica los empaquetamientos que aún no tienen familia
        /// (IdFamiliaEmpaquetamiento IS NULL). Idempotente. Retorna cuántos se clasificaron.
        /// </summary>
        Task<int> ClasificarPendientesAsync();
    }
}
