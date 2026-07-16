namespace Application.Common.Models
{
    /// <summary>
    /// Resultado paginado genérico.
    /// T puede ser Insumo, Movimiento, o cualquier entidad.
    /// </summary>
    public class PagedResult<T>
    {
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / Math.Max(PageSize, 1));
        public bool HasPreviousPage => Page > 1;
        public bool HasNextPage => Page < TotalPages;
        public List<T> Items { get; set; } = new();
    }
}
