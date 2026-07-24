using Application.Common.Helpers;
using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    /// <summary>
    /// Repositorio de movimientos con consultas optimizadas para la BD.
    ///
    /// La magia está en GetStockGeneralDbAsync():
    /// Una sola consulta SQL con GROUP BY que hace toda la agregación
    /// en el servidor. No trae los millones de registros a la memoria.
    /// </summary>
    public class MovimientoRepository : BaseRepository<MovimientoInventario>, IMovimientoRepository
    {
        public MovimientoRepository(AppDbContext context) : base(context)
        {
        }

        // ==========================================
        // STOCK GENERAL (TODOS LOS INSUMOS) — OPTIMIZADO
        // ==========================================
        // SQL que se ejecuta:
        //
        //   SELECT
        //       m.IdInsumo,
        //       SUM(CASE
        //           WHEN m.TipoMovimiento = 'INGRESO' THEN m.Cantidad
        //           WHEN m.TipoMovimiento = 'SALIDA'  THEN -m.Cantidad
        //           ELSE m.Cantidad
        //       END) AS StockActual,
        //       SUM(CASE WHEN m.TipoMovimiento = 'INGRESO' THEN m.Cantidad ELSE 0 END) AS TotalIngresos,
        //       SUM(CASE WHEN m.TipoMovimiento = 'SALIDA'  THEN m.Cantidad ELSE 0 END) AS TotalSalidas
        //   FROM MovimientoInventario m
        //   GROUP BY m.IdInsumo
        //
        // Esto devuelve UNA FILA POR INSUMO con los totales ya calculados. 🚀
        // ==========================================
        public async Task<List<StockDbResult>> GetStockGeneralDbAsync()
        {
            return await _context.Database
                .SqlQueryRaw<StockDbResult>(@"
                    SELECT
                        m.IdInsumo,
                        SUM(CASE
                            WHEN m.TipoMovimiento = 'INGRESO' THEN m.Cantidad
                            WHEN m.TipoMovimiento = 'SALIDA'  THEN -m.Cantidad
                            ELSE m.Cantidad
                        END) AS StockActual,
                        SUM(CASE WHEN m.TipoMovimiento = 'INGRESO' THEN m.Cantidad ELSE 0 END) AS TotalIngresos,
                        SUM(CASE WHEN m.TipoMovimiento = 'SALIDA'  THEN m.Cantidad ELSE 0 END) AS TotalSalidas
                    FROM MovimientoInventario m
                    GROUP BY m.IdInsumo")
                .ToListAsync();
        }

        // ==========================================
        // STOCK DE UN SOLO INSUMO
        // ==========================================
        public async Task<int> GetStockByInsumoAsync(int insumoId)
        {
            var result = await _context.Database
                .SqlQueryRaw<int>(@"
                    SELECT ISNULL(SUM(CASE
                        WHEN m.TipoMovimiento = 'INGRESO' THEN m.Cantidad
                        WHEN m.TipoMovimiento = 'SALIDA'  THEN -m.Cantidad
                        ELSE m.Cantidad
                    END), 0) AS Value
                    FROM MovimientoInventario m
                    WHERE m.IdInsumo = {0}", insumoId)
                .FirstOrDefaultAsync();

            return result;
        }

        // ==========================================
        // FILTRO COMPUESTO (NUEVO)
        // ==========================================
        public async Task<PagedResult<MovimientoInventario>> FilterPagedAsync(MovimientoFilterDto filter)
        {
            var filterExpression = FilterExpressionBuilder.BuildMovimientoFilter(filter);
            var orderBy = BuildMovimientoOrderBy(filter.SortBy, filter.SortDescending);

            var paged = await base.GetPagedAsync(
                filter.Page,
                filter.PageSize,
                filterExpression,
                orderBy,
                "Insumo", "Proveedor", "TipoCompra", "Proyecto", "EstadoSalida");

            // Tenemos que cargar explícitamente Insumo.Ubicacion porque GetPagedAsync del BaseRepository solo soporta 1 nivel
            // Como esto devuelve entidades trackeadas, EF Core vinculará la navegación.
            var insumoIds = paged.Items.Select(x => x.IdInsumo).Distinct().ToList();
            await _context.Insumos.Include(i => i.Ubicacion).Where(i => insumoIds.Contains(i.Id)).LoadAsync();

            return paged;
        }

        private static Func<IQueryable<MovimientoInventario>, IOrderedQueryable<MovimientoInventario>>? BuildMovimientoOrderBy(
            string? sortBy, bool desc)
        {
            return sortBy?.ToLower() switch
            {
                "fecha" => desc
                    ? q => q.OrderByDescending(m => m.Fecha)
                    : q => q.OrderBy(m => m.Fecha),
                "cantidad" => desc
                    ? q => q.OrderByDescending(m => m.Cantidad)
                    : q => q.OrderBy(m => m.Cantidad),
                "preciounitario" => desc
                    ? q => q.OrderByDescending(m => m.PrecioUnitario ?? 0)
                    : q => q.OrderBy(m => m.PrecioUnitario ?? 0),
                "insumo" => desc
                    ? q => q.OrderByDescending(m => m.Insumo.CodigoFabrica)
                    : q => q.OrderBy(m => m.Insumo.CodigoFabrica),
                "tipomovimiento" => desc
                    ? q => q.OrderByDescending(m => m.TipoMovimiento)
                    : q => q.OrderBy(m => m.TipoMovimiento),
                _ => desc
                    ? q => q.OrderByDescending(m => m.Fecha)
                    : q => q.OrderBy(m => m.Fecha) // default: más recientes primero
            };
        }
    }
}
