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
                            WHEN m.TipoMovimiento = 'UNIFICAR' THEN 0
                            WHEN m.TipoMovimiento = 'TRASLADO' THEN 0
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
                        WHEN m.TipoMovimiento = 'UNIFICAR' THEN 0
                        WHEN m.TipoMovimiento = 'TRASLADO' THEN 0
                        ELSE m.Cantidad
                    END), 0) AS Value
                    FROM MovimientoInventario m
                    WHERE m.IdInsumo = {0}", insumoId)
                .FirstOrDefaultAsync();

            return result;
        }

        // ==========================================
        // STOCK POR UBICACION DE UN SOLO INSUMO
        // ==========================================
        public async Task<List<StockUbicacionResult>> GetStockPorUbicacionAsync(int insumoId)
        {
            return await _context.Database
                .SqlQueryRaw<StockUbicacionResult>(@"
                    SELECT
                        Ubi.Id as IdUbicacion,
                        Ubi.Nombre as UbicacionNombre,
                        ISNULL(SUM(T.Cantidad), 0) AS Stock
                    FROM (
                        SELECT IdUbicacion, 
                               CASE 
                                   WHEN TipoMovimiento = 'SALIDA' THEN -Cantidad
                                   WHEN TipoMovimiento = 'UNIFICAR' THEN 0
                                   ELSE Cantidad 
                               END as Cantidad
                        FROM MovimientoInventario
                        WHERE IdInsumo = {0} AND IdUbicacion IS NOT NULL
                        
                        UNION ALL
                        
                        SELECT IdUbicacionAnterior as IdUbicacion,
                               -Cantidad as Cantidad
                        FROM MovimientoInventario
                        WHERE IdInsumo = {0} AND TipoMovimiento = 'TRASLADO' AND IdUbicacionAnterior IS NOT NULL
                    ) T
                    JOIN Ubicacion Ubi ON T.IdUbicacion = Ubi.Id
                    GROUP BY Ubi.Id, Ubi.Nombre
                    HAVING SUM(T.Cantidad) > 0", insumoId)
                .ToListAsync();
        }

        // ==========================================
        // STOCK POR UBICACION DE MÚLTIPLES INSUMOS
        // ==========================================
        public async Task<Dictionary<int, List<StockUbicacionResult>>> GetStockPorUbicacionPorInsumosAsync(int[] insumoIds)
        {
            if (insumoIds == null || insumoIds.Length == 0) return new Dictionary<int, List<StockUbicacionResult>>();

            var idsParam = string.Join(",", insumoIds);
            
#pragma warning disable EF1002 // Vulnerability to SQL injection
            var rawResults = await _context.Database
                .SqlQueryRaw<StockUbicacionBatchResult>($@"
                    SELECT
                        T.IdInsumo,
                        Ubi.Id as IdUbicacion,
                        Ubi.Nombre as UbicacionNombre,
                        ISNULL(SUM(T.Cantidad), 0) AS Stock
                    FROM (
                        SELECT IdInsumo, IdUbicacion, 
                               CASE 
                                   WHEN TipoMovimiento = 'SALIDA' THEN -Cantidad
                                   WHEN TipoMovimiento = 'UNIFICAR' THEN 0
                                   ELSE Cantidad 
                               END as Cantidad
                        FROM MovimientoInventario
                        WHERE IdInsumo IN ({idsParam}) AND IdUbicacion IS NOT NULL
                        
                        UNION ALL
                        
                        SELECT IdInsumo, IdUbicacionAnterior as IdUbicacion,
                               -Cantidad as Cantidad
                        FROM MovimientoInventario
                        WHERE IdInsumo IN ({idsParam}) AND TipoMovimiento = 'TRASLADO' AND IdUbicacionAnterior IS NOT NULL
                    ) T
                    JOIN Ubicacion Ubi ON T.IdUbicacion = Ubi.Id
                    GROUP BY T.IdInsumo, Ubi.Id, Ubi.Nombre
                    HAVING SUM(T.Cantidad) > 0")
                .ToListAsync();
#pragma warning restore EF1002

            return rawResults
                .GroupBy(r => r.IdInsumo)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(r => new StockUbicacionResult 
                    { 
                        IdUbicacion = r.IdUbicacion, 
                        UbicacionNombre = r.UbicacionNombre, 
                        Stock = r.Stock 
                    }).ToList()
                );
        }

        public class StockUbicacionBatchResult
        {
            public int IdInsumo { get; set; }
            public int IdUbicacion { get; set; }
            public string UbicacionNombre { get; set; } = string.Empty;
            public int Stock { get; set; }
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
                "Insumo", "Proveedor", "TipoCompra", "Proyecto", "EstadoSalida", "Ubicacion", "UbicacionAnterior");

            return paged;
        }

        // ==========================================
        // MIGRACIÓN MASIVA DE MOVIMIENTOS
        // ==========================================
        public async Task MigrateMovimientosAsync(int[] oldInsumoIds, int newInsumoId)
        {
            if (oldInsumoIds == null || oldInsumoIds.Length == 0) return;

            // ExecuteUpdateAsync actualiza masivamente sin cargar registros en memoria
            await _context.MovimientosInventario
                .Where(m => oldInsumoIds.Contains(m.IdInsumo))
                .ExecuteUpdateAsync(s => s.SetProperty(m => m.IdInsumo, newInsumoId));

            // ⚠️ ExecuteUpdateAsync opera directamente en SQL sin actualizar el change tracker.
            // Es necesario limpiar el tracker para que EF Core no intente reconciliar
            // entidades obsoletas al hacer SaveChangesAsync en operaciones posteriores.
            _context.ChangeTracker.Clear();
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
