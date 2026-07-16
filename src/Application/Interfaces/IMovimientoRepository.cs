using Application.Common.Interfaces;
using Domain.Entities;

namespace Application.Interfaces
{
    /// <summary>
    /// Repositorio específico para movimientos de inventario.
    /// Hereda todo el CRUD genérico y agrega métodos
    /// de agregación que se ejecutan DIRECTAMENTE en SQL Server.
    ///
    /// Esto evita cargar millones de registros en memoria
    /// para calcular el stock.
    /// </summary>
    public interface IMovimientoRepository : IBaseRepository<MovimientoInventario>
    {
        /// <summary>
        /// Calcula el stock de TODOS los insumos con UNA SOLA CONSULTA SQL.
        /// La agregación (SUM + GROUP BY) corre en el servidor, no en C#.
        /// </summary>
        Task<List<StockDbResult>> GetStockGeneralDbAsync();

        /// <summary>
        /// Calcula el stock de UN insumo específico.
        /// </summary>
        Task<int> GetStockByInsumoAsync(int insumoId);
    }

    /// <summary>
    /// Resultado de la consulta agregada de stock.
    /// Mapea directo al resultado del GROUP BY en SQL.
    /// </summary>
    public class StockDbResult
    {
        public int IdInsumo { get; set; }
        public int StockActual { get; set; }
        public int TotalIngresos { get; set; }
        public int TotalSalidas { get; set; }
    }
}
