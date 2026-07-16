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
    }
}
