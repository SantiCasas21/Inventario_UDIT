using Application.Common.Interfaces;
using Application.DTOs;
using Application.Interfaces;
using Application.Services;
using Domain.Entities;
using Domain.Entities.Catalogos;
using Infrastructure.Data;
using Infrastructure.Extensions;
using Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// Services
// ==========================================

// Infrastructure (DbContext, repositorios)
builder.Services.AddInfrastructure(builder.Configuration);

// Repositorio específico de Insumo
builder.Services.AddScoped<IInsumoRepository, InsumoRepository>();

// ==========================================
// Servicios de Catálogo (uno por cada tipo)
// ==========================================
// Cada servicio recibe 5 parámetros:
//   1. Repositorio genérico
//   2. Función para mapear entidad → DTO
//   3. Función para crear entidad desde request
//   4. Acción para setear el nombre (SIN REFLEXIÓN)
//   5. Nombre legible del catálogo

builder.Services.AddScoped(sp => new CatalogoService<CategoriaInsumo>(
    sp.GetRequiredService<IBaseRepository<CategoriaInsumo>>(),
    e => new CatalogoDto { Id = e.Id, Nombre = e.Nombre },
    req => new CategoriaInsumo { Nombre = req.Nombre },
    (e, v) => e.Nombre = v,
    "Categoría de Insumo"
));

builder.Services.AddScoped(sp => new CatalogoService<Empaquetamiento>(
    sp.GetRequiredService<IBaseRepository<Empaquetamiento>>(),
    e => new CatalogoDto { Id = e.Id, Nombre = e.Tipo },
    req => new Empaquetamiento { Tipo = req.Nombre },
    (e, v) => e.Tipo = v,
    "Empaquetamiento"
));

builder.Services.AddScoped(sp => new CatalogoService<Ubicacion>(
    sp.GetRequiredService<IBaseRepository<Ubicacion>>(),
    e => new CatalogoDto { Id = e.Id, Nombre = e.Nombre },
    req => new Ubicacion { Nombre = req.Nombre },
    (e, v) => e.Nombre = v,
    "Ubicación"
));

builder.Services.AddScoped(sp => new CatalogoService<TipoCompra>(
    sp.GetRequiredService<IBaseRepository<TipoCompra>>(),
    e => new CatalogoDto { Id = e.Id, Nombre = e.Nombre },
    req => new TipoCompra { Nombre = req.Nombre },
    (e, v) => e.Nombre = v,
    "Tipo de Compra"
));

builder.Services.AddScoped(sp => new CatalogoService<EstadoSalida>(
    sp.GetRequiredService<IBaseRepository<EstadoSalida>>(),
    e => new CatalogoDto { Id = e.Id, Nombre = e.Nombre },
    req => new EstadoSalida { Nombre = req.Nombre },
    (e, v) => e.Nombre = v,
    "Estado de Salida"
));

builder.Services.AddScoped(sp => new CatalogoService<EstadoProyecto>(
    sp.GetRequiredService<IBaseRepository<EstadoProyecto>>(),
    e => new CatalogoDto { Id = e.Id, Nombre = e.Estado },
    req => new EstadoProyecto { Estado = req.Nombre },
    (e, v) => e.Estado = v,
    "Estado de Proyecto"
));

builder.Services.AddScoped(sp => new CatalogoService<Proveedor>(
    sp.GetRequiredService<IBaseRepository<Proveedor>>(),
    e => new CatalogoDto { Id = e.Id, Nombre = e.Nombre },
    req => new Proveedor { Nombre = req.Nombre },
    (e, v) => e.Nombre = v,
    "Proveedor"
));

builder.Services.AddScoped(sp => new CatalogoService<Personal>(
    sp.GetRequiredService<IBaseRepository<Personal>>(),
    e => new CatalogoDto { Id = e.Id, Nombre = e.Nombre },
    req => new Personal { Nombre = req.Nombre },
    (e, v) => e.Nombre = v,
    "Personal"
));

// KardexService
builder.Services.AddScoped<KardexService>();

// ReporteService
builder.Services.AddScoped<ReporteService>();

// Controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Fechas en formato ISO 8601 sin timezone
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new()
    {
        Title = "UDIT Inventario API v2",
        Description = "API modernizada para la gestión de inventario - Clean Architecture + .NET 9",
        Version = "v1"
    });
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// ==========================================
// Middleware Pipeline
// ==========================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");

app.UseHttpsRedirection();

app.MapControllers();

// Auto-migrate en Development
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.Run();
