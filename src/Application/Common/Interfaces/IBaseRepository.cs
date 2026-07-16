using System.Linq.Expressions;
using Application.Common.Models;

namespace Application.Common.Interfaces
{
    /// <summary>
    /// Repositorio genérico. T representa cualquier entidad.
    /// Un solo código que sirve para todas las entidades.
    /// </summary>
    public interface IBaseRepository<T> where T : class
    {
        /// <summary>Obtener todos los registros</summary>
        Task<IEnumerable<T>> GetAllAsync();

        /// <summary>
        /// Obtener todos incluyendo relaciones (ej: .Include("Categoria").Include("Ubicacion"))
        /// </summary>
        Task<IEnumerable<T>> GetAllAsync(params string[] includes);

        /// <summary>Obtener uno por ID</summary>
        Task<T?> GetByIdAsync(int id);

        /// <summary>
        /// Obtener uno por ID incluyendo relaciones
        /// </summary>
        Task<T?> GetByIdAsync(int id, params string[] includes);

        /// <summary>
        /// Obtener paginado con filtro opcional.
        /// Ej: GetPagedAsync(page: 1, pageSize: 20, filter: i => i.IdCategoria == 5)
        /// </summary>
        Task<PagedResult<T>> GetPagedAsync(int page, int pageSize,
            Expression<Func<T, bool>>? filter = null,
            params string[] includes);

        /// <summary>Agregar uno nuevo</summary>
        Task<T> AddAsync(T entity);

        /// <summary>Actualizar uno existente</summary>
        Task UpdateAsync(T entity);

        /// <summary>Eliminar uno por ID</summary>
        Task DeleteAsync(int id);

        /// <summary>Verificar si existe un registro con ese ID</summary>
        Task<bool> ExistsAsync(int id);

        /// <summary>
        /// Buscar registros que cumplan una condición.
        /// Se traduce a WHERE en SQL. Ej: FindAsync(m => m.IdInsumo == 5)
        /// </summary>
        Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);

        /// <summary>
        /// Buscar con condición + Include.
        /// </summary>
        Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate, params string[] includes);
    }
}
