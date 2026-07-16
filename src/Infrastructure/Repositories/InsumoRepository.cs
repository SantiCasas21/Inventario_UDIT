using Application.Interfaces;
using Application.Common.Models;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    /// <summary>
    /// Implementación del repositorio de Insumo con filtros.
    /// Los filtros se construyen dinámicamente con IQueryable
    /// para que EF Core genere el WHERE óptimo en SQL.
    /// </summary>
    public class InsumoRepository : BaseRepository<Insumo>, IInsumoRepository
    {
        public InsumoRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<PagedResult<Insumo>> SearchPagedAsync(
            int? idCategoria = null,
            string? codigoFabrica = null,
            string? descripcion = null,
            int page = 1,
            int pageSize = 20)
        {
            // Construir query base con includes
            IQueryable<Insumo> query = _dbSet
                .Include(i => i.Categoria)
                .Include(i => i.Empaquetamiento)
                .Include(i => i.Ubicacion);

            // Aplicar filtros UNO A UNO (solo los que no son null)
            if (idCategoria.HasValue)
                query = query.Where(i => i.IdCategoria == idCategoria.Value);

            if (!string.IsNullOrWhiteSpace(codigoFabrica))
                query = query.Where(i => i.CodigoFabrica.Contains(codigoFabrica));

            if (!string.IsNullOrWhiteSpace(descripcion))
                query = query.Where(i =>
                    i.Descripcion != null && i.Descripcion.Contains(descripcion));

            // Contar total (query ligera, solo COUNT)
            var totalCount = await query.CountAsync();

            // Paginar
            var items = await query
                .OrderBy(i => i.CodigoFabrica)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<Insumo>
            {
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                Items = items
            };
        }
    }
}
