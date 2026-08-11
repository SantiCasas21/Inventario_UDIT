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

        /// <summary>
        /// Retorna las ubicaciones que están disponibles (sin insumos con stock > 0).
        /// Útil para mostrar solo ubicaciones vacías al crear un nuevo insumo.
        /// </summary>
        Task<List<CatalogoDto>> GetUbicacionesDisponiblesAsync();

        /// <summary>
        /// Unifica todos los insumos con el mismo CodigoFabrica hacia el IdInsumo proporcionado.
        /// Transfiere todos los movimientos al insumo principal y elimina los insumos duplicados.
        /// </summary>
        Task<OperationResult> UnificarDuplicadosAsync(string codigoFabrica, int idInsumoPrincipal);
    }
}
