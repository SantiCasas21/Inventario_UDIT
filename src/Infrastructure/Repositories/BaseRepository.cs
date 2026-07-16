using System.Linq.Expressions;
using Application.Common.Interfaces;
using Application.Common.Models;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    /// <summary>
    /// Implementación genérica del repositorio.
    /// T puede ser CategoriaInsumo, Empaquetamiento, Ubicacion...
    /// Un mismo código que funciona para TODAS las entidades.
    /// </summary>
    public class BaseRepository<T> : IBaseRepository<T> where T : class
    {
        protected readonly AppDbContext _context;
        protected readonly DbSet<T> _dbSet;

        public BaseRepository(AppDbContext context)
        {
            _context = context;
            _dbSet = context.Set<T>();
        }

        // ==========================================
        // OBTENER TODOS
        // ==========================================
        public virtual async Task<IEnumerable<T>> GetAllAsync()
        {
            return await _dbSet.ToListAsync();
        }

        /// <summary>
        /// Obtener todos con Include de navegación.
        /// Uso: GetAllAsync("Categoria", "Empaquetamiento", "Ubicacion")
        /// </summary>
        public virtual async Task<IEnumerable<T>> GetAllAsync(params string[] includes)
        {
            IQueryable<T> query = _dbSet;
            foreach (var include in includes)
            {
                query = query.Include(include);
            }
            return await query.ToListAsync();
        }

        // ==========================================
        // OBTENER POR ID
        // ==========================================
        public virtual async Task<T?> GetByIdAsync(int id)
        {
            return await _dbSet.FindAsync(id);
        }

        /// <summary>
        /// Obtener por ID con Include de navegación.
        /// </summary>
        public virtual async Task<T?> GetByIdAsync(int id, params string[] includes)
        {
            IQueryable<T> query = _dbSet;
            foreach (var include in includes)
            {
                query = query.Include(include);
            }
            return await query.FirstOrDefaultAsync(e => EF.Property<int>(e, "Id") == id);
        }

        // ==========================================
        // OBTENER PAGINADO (con filtro + includes)
        // ==========================================
        public virtual async Task<PagedResult<T>> GetPagedAsync(
            int page, int pageSize,
            Expression<Func<T, bool>>? filter = null,
            params string[] includes)
        {
            // Validar página (nunca menor a 1)
            page = Math.Max(1, page);
            pageSize = Math.Max(1, Math.Min(pageSize, 200)); // máx 200 por página

            IQueryable<T> query = _dbSet;

            // Aplicar filtro
            if (filter != null)
                query = query.Where(filter);

            // Contar total antes de paginar (una query rápida)
            var totalCount = await query.CountAsync();

            // Aplicar includes
            foreach (var include in includes)
            {
                query = query.Include(include);
            }

            // Paginar y ejecutar
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<T>
            {
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                Items = items
            };
        }

        // ==========================================
        // AGREGAR
        // ==========================================
        public virtual async Task<T> AddAsync(T entity)
        {
            await _dbSet.AddAsync(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        // ==========================================
        // ACTUALIZAR
        // ==========================================
        public virtual async Task UpdateAsync(T entity)
        {
            _dbSet.Update(entity);
            await _context.SaveChangesAsync();
        }

        // ==========================================
        // ELIMINAR
        // ==========================================
        public virtual async Task DeleteAsync(int id)
        {
            var entity = await _dbSet.FindAsync(id);
            if (entity != null)
            {
                _dbSet.Remove(entity);
                await _context.SaveChangesAsync();
            }
        }

        // ==========================================
        // VERIFICAR EXISTENCIA
        // ==========================================
        public virtual async Task<bool> ExistsAsync(int id)
        {
            var entity = await _dbSet.FindAsync(id);
            return entity != null;
        }

        // ==========================================
        // BUSCAR POR CONDICIÓN
        // ==========================================
        public virtual async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
        {
            return await _dbSet.Where(predicate).ToListAsync();
        }

        public virtual async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate, params string[] includes)
        {
            IQueryable<T> query = _dbSet.Where(predicate);
            foreach (var include in includes)
            {
                query = query.Include(include);
            }
            return await query.ToListAsync();
        }
    }
}
