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

            // Nota: El filtro por IdsUbicacion ya no se hace aquí porque Insumo ya no tiene IdUbicacion.
            // Se debe manejar en InsumoService cruzando con los datos de MovimientoInventario.

            // Multi-select: Unidades de Medida
            if (filter.UnidadesMedida?.Count > 0)
                predicate = predicate.And(i => !string.IsNullOrEmpty(i.UnidadMedida) && filter.UnidadesMedida.Contains(i.UnidadMedida));

            // Rango: valor mínimo
            if (filter.ValorMedidaMin.HasValue)
                predicate = predicate.And(i => i.ValorMedida >= filter.ValorMedidaMin.Value);

            // Rango: valor máximo
            if (filter.ValorMedidaMax.HasValue)
                predicate = predicate.And(i => i.ValorMedida <= filter.ValorMedidaMax.Value);

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
                var tipos = filter.TiposMovimiento
                    .Select(t => 
                    {
                        if (t.Equals("UNIFICAR", StringComparison.OrdinalIgnoreCase))
                            return Domain.Enums.TipoMovimiento.Unificacion;
                        return Enum.Parse<Domain.Enums.TipoMovimiento>(t, ignoreCase: true);
                    })
                    .ToList();
                predicate = predicate.And(m => tipos.Contains(m.TipoMovimiento));
            }

            // Multi-select: insumos
            if (filter.IdsInsumo?.Count > 0)
                predicate = predicate.And(m => filter.IdsInsumo.Contains(m.IdInsumo));

            // Multi-select: categorias
            if (filter.IdsCategoria?.Count > 0)
            {
                predicate = predicate.And(m =>
                    m.Insumo != null && filter.IdsCategoria.Contains(m.Insumo.IdCategoria));
            }

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

            // Texto: búsqueda por código de fábrica del insumo
            if (!string.IsNullOrWhiteSpace(filter.CodigoFabricaSearch))
            {
                var search = filter.CodigoFabricaSearch.Trim();
                predicate = predicate.And(m =>
                    m.Insumo != null && m.Insumo.CodigoFabrica.Contains(search));
            }

            return predicate;
        }
    }
}
