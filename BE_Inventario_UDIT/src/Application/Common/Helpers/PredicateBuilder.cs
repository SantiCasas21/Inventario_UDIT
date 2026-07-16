using System.Linq.Expressions;

namespace Application.Common.Helpers
{
    /// <summary>
    /// PredicateBuilder — combina expresiones lambda con AND/OR
    /// para construir filtros dinámicos que EF Core traduce a SQL.
    /// Inspirado en el patrón LINQKit.
    /// </summary>
    public static class PredicateBuilder
    {
        public static Expression<Func<T, bool>> True<T>() => _ => true;
        public static Expression<Func<T, bool>> False<T>() => _ => false;

        public static Expression<Func<T, bool>> And<T>(
            this Expression<Func<T, bool>> left,
            Expression<Func<T, bool>> right)
        {
            var invoked = Expression.Invoke(right, left.Parameters);
            return Expression.Lambda<Func<T, bool>>(
                Expression.AndAlso(left.Body, invoked), left.Parameters);
        }

        public static Expression<Func<T, bool>> Or<T>(
            this Expression<Func<T, bool>> left,
            Expression<Func<T, bool>> right)
        {
            var invoked = Expression.Invoke(right, left.Parameters);
            return Expression.Lambda<Func<T, bool>>(
                Expression.OrElse(left.Body, invoked), left.Parameters);
        }
    }
}
