using System.Linq.Expressions;
using Application.DTOs;
using Domain.Entities;

namespace Application.Common.Helpers
{
    /// <summary>
    /// Construye Expression&lt;Func&lt;T, bool&gt;&gt; a partir de los DTOs de filtro.
    /// El resultado se pasa a BaseRepository.GetPagedAsync para que EF Core
    /// genere el WHERE óptimo en SQL.
    ///
    /// Regla: solo se agregan condiciones para los filtros que tienen valor.
    /// Sin filtros = sin WHERE (devuelve todos).
    /// </summary>
    public static class FilterExpressionBuilder
    {
        // ==========================================
        // INSUMO
        // ==========================================
        public static Expression<Func<Insumo, bool>> BuildInsumoFilter(InsumoFilterDto filter)
        {
            var predicate = PredicateBuilder.True<Insumo>();

            // Multi-select: categorías
            if (filter.IdsCategoria?.Count > 0)
                predicate = predicate.And(i => filter.IdsCategoria.Contains(i.IdCategoria));

            // Multi-select: empaquetamientos
            if (filter.IdsEmpaquetamiento?.Count > 0)
                predicate = predicate.And(i => filter.IdsEmpaquetamiento.Contains(i.IdEmpaquetamiento));

            // Multi-select: ubicaciones
            if (filter.IdsUbicacion?.Count > 0)
                predicate = predicate.And(i => filter.IdsUbicacion.Contains(i.IdUbicacion));

            // Rango: precio mínimo
            if (filter.PrecioMin.HasValue)
                predicate = predicate.And(i => i.PrecioReferencia >= filter.PrecioMin.Value);

            // Rango: precio máximo
            if (filter.PrecioMax.HasValue)
                predicate = predicate.And(i => i.PrecioReferencia <= filter.PrecioMax.Value);

            // Texto: búsqueda en CódigoFabrica Y Descripción (OR entre ellos)
            if (!string.IsNullOrWhiteSpace(filter.TextSearch))
            {
                var search = filter.TextSearch.Trim();
                predicate = predicate.And(i =>
                    i.CodigoFabrica.Contains(search) ||
                    (i.Descripcion != null && i.Descripcion.Contains(search)));
            }

            return predicate;
        }

        // ==========================================
        // MOVIMIENTO
        // ==========================================
        public static Expression<Func<MovimientoInventario, bool>> BuildMovimientoFilter(MovimientoFilterDto filter)
        {
            var predicate = PredicateBuilder.True<MovimientoInventario>();

            // Multi-select: tipos de movimiento
            if (filter.TiposMovimiento?.Count > 0)
            {
                // Convertir strings a enum para comparación en memoria
                // EF Core traduce el Contains sobre lista de enums a IN (...)
                var tipos = filter.TiposMovimiento
                    .Select(t => Enum.Parse<Domain.Enums.TipoMovimiento>(t, ignoreCase: true))
                    .ToList();
                predicate = predicate.And(m => tipos.Contains(m.TipoMovimiento));
            }

            // Multi-select: insumos
            if (filter.IdsInsumo?.Count > 0)
                predicate = predicate.And(m => filter.IdsInsumo.Contains(m.IdInsumo));

            // Multi-select: proveedores
            if (filter.IdsProveedor?.Count > 0)
            {
                predicate = predicate.And(m =>
                    m.IdProveedor != null && filter.IdsProveedor.Contains(m.IdProveedor.Value));
            }

            // Multi-select: proyectos
            if (filter.IdsProyecto?.Count > 0)
            {
                predicate = predicate.And(m =>
                    m.IdProyecto != null && filter.IdsProyecto.Contains(m.IdProyecto.Value));
            }

            // Multi-select: tipos de compra
            if (filter.IdsTipoCompra?.Count > 0)
            {
                predicate = predicate.And(m =>
                    m.IdTipoCompra != null && filter.IdsTipoCompra.Contains(m.IdTipoCompra.Value));
            }

            // Multi-select: estados de salida
            if (filter.IdsEstadoSalida?.Count > 0)
            {
                predicate = predicate.And(m =>
                    m.IdEstadoSalida != null && filter.IdsEstadoSalida.Contains(m.IdEstadoSalida.Value));
            }

            // Rangos: cantidad
            if (filter.CantidadMin.HasValue)
                predicate = predicate.And(m => m.Cantidad >= filter.CantidadMin.Value);

            if (filter.CantidadMax.HasValue)
                predicate = predicate.And(m => m.Cantidad <= filter.CantidadMax.Value);

            // Rangos: precio unitario
            if (filter.PrecioUnitarioMin.HasValue)
                predicate = predicate.And(m =>
                    m.PrecioUnitario != null && m.PrecioUnitario >= filter.PrecioUnitarioMin.Value);

            if (filter.PrecioUnitarioMax.HasValue)
                predicate = predicate.And(m =>
                    m.PrecioUnitario != null && m.PrecioUnitario <= filter.PrecioUnitarioMax.Value);

            // Rangos: fecha
            if (filter.FechaDesde.HasValue)
                predicate = predicate.And(m => m.Fecha >= filter.FechaDesde.Value);

            if (filter.FechaHasta.HasValue)
                predicate = predicate.And(m => m.Fecha <= filter.FechaHasta.Value);

            // Texto: búsqueda en observación
            if (!string.IsNullOrWhiteSpace(filter.TextSearch))
            {
                var search = filter.TextSearch.Trim();
                predicate = predicate.And(m =>
                    m.Observacion != null && m.Observacion.Contains(search));
            }

            return predicate;
        }
    }
}
