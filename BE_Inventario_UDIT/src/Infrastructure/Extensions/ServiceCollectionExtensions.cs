using Application.Common.Interfaces;
using Application.Interfaces;
using Infrastructure.Data;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddInfrastructure(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            // ==========================================
            // DbContext
            // ==========================================
            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseSqlServer(
                    configuration.GetConnectionString("DefaultConnection"),
                    sqlOptions =>
                    {
                        sqlOptions.EnableRetryOnFailure(
                            maxRetryCount: 3,
                            maxRetryDelay: TimeSpan.FromSeconds(10),
                            errorNumbersToAdd: null);
                    });
                options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
            });


            // ==========================================
            // Repositorio genérico
            // ==========================================
            services.AddScoped(typeof(IBaseRepository<>), typeof(BaseRepository<>));

            // ==========================================
            // Repositorio específico de insumos (con búsqueda avanzada)
            // ==========================================
            services.AddScoped<IInsumoRepository, InsumoRepository>();

            // ==========================================
            // Repositorio específico de movimientos (con consultas SQL optimizadas)
            // ==========================================
            services.AddScoped<IMovimientoRepository, MovimientoRepository>();

            return services;
        }
    }
}
