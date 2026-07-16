using Application.Common.Interfaces;
using Application.Common.Models;
using Application.DTOs;
using Domain.Entities;

namespace Application.Interfaces
{
    /// <summary>
    /// Repositorio específico para Insumo con búsqueda avanzada.
    /// Hereda CRUD genérico + paginación, y agrega filtros.
    /// </summary>
    public interface IInsumoRepository : IBaseRepository<Insumo>
    {
        /// <summary>
        /// Búsqueda paginada con filtros múltiples.
        /// Todos los filtros son opcionales — se aplican solo los que vienen.
        /// </summary>
        Task<PagedResult<Insumo>> SearchPagedAsync(
            int? idCategoria = null,
            string? codigoFabrica = null,
            string? descripcion = null,
            int page = 1,
            int pageSize = 20);

        /// <summary>
        /// Filtro compuesto estilo catálogo paramétrico (multi-select, rangos, texto, ordenamiento).
        /// Reemplazo moderno de SearchPagedAsync con todas las capacidades de filtro.
        /// </summary>
        Task<PagedResult<Insumo>> FilterPagedAsync(InsumoFilterDto filter);
    }
}
