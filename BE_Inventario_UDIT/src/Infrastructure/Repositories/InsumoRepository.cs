using Application.Common.Helpers;
using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;
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
            // Construir query base con includes (sin tracking para lectura óptima)
            IQueryable<Insumo> query = _dbSet.AsNoTracking()
                .Include(i => i.Categoria)
                .Include(i => i.Empaquetamiento);

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

        // ==========================================
        // FILTRO COMPUESTO (NUEVO)
        // ==========================================
        public async Task<PagedResult<Insumo>> FilterPagedAsync(InsumoFilterDto filter)
        {
            var filterExpression = FilterExpressionBuilder.BuildInsumoFilter(filter);
            var orderBy = BuildInsumoOrderBy(filter.SortBy, filter.SortDescending);

            return await base.GetPagedAsync(
                filter.Page,
                filter.PageSize,
                filterExpression,
                orderBy,
                "Categoria", "Empaquetamiento");
        }

        private static Func<IQueryable<Insumo>, IOrderedQueryable<Insumo>>? BuildInsumoOrderBy(
            string? sortBy, bool desc)
        {
            return sortBy?.ToLower() switch
            {
                "codigofabrica" => desc
                    ? q => q.OrderByDescending(i => i.CodigoFabrica)
                    : q => q.OrderBy(i => i.CodigoFabrica),
                "descripcion" => desc
                    ? q => q.OrderByDescending(i => i.Descripcion ?? "")
                    : q => q.OrderBy(i => i.Descripcion ?? ""),
                "precioreferencia" => desc
                    ? q => q.OrderByDescending(i => i.PrecioReferencia ?? 0)
                    : q => q.OrderBy(i => i.PrecioReferencia ?? 0),
                "valormedida" => desc
                    ? q => q.OrderByDescending(i => i.ValorMedida ?? 0)
                    : q => q.OrderBy(i => i.ValorMedida ?? 0),
                "categoria" => desc
                    ? q => q.OrderByDescending(i => i.Categoria.Nombre)
                    : q => q.OrderBy(i => i.Categoria.Nombre),
                "empaquetamiento" => desc
                    ? q => q.OrderByDescending(i => i.Empaquetamiento.Tipo)
                    : q => q.OrderBy(i => i.Empaquetamiento.Tipo),
                _ => null // default: BaseRepository ordena por Id
            };
        }
    }
}
