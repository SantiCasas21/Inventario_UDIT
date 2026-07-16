using System.Text;
using Application.Common.Interfaces;
using Application.DTOs;
using Application.Interfaces;
using Application.Services;
using Domain.Entities;
using Domain.Entities.Catalogos;
using Infrastructure.Data;
using Infrastructure.Extensions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// Infrastructure (DbContext, Identity, repositorios)
// ==========================================
builder.Services.AddInfrastructure(builder.Configuration);

// ==========================================
// ASP.NET Core Identity
// ==========================================
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 8;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = true;
    options.Password.RequireLowercase = true;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// ==========================================
// JWT Authentication
// ==========================================
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("JWT Key no configurada");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero
    };
});

// ==========================================
// Auth Service
// ==========================================
builder.Services.AddScoped<IAuthService, AuthService>();

// ==========================================
// Servicios de Catálogo (uno por cada tipo)
// ==========================================
builder.Services.AddScoped<ICatalogoService<CategoriaInsumo>>(sp => new CatalogoService<CategoriaInsumo>(
    sp.GetRequiredService<IBaseRepository<CategoriaInsumo>>(),
    e => new CatalogoDto { Id = e.Id, Nombre = e.Nombre },
    req => new CategoriaInsumo { Nombre = req.Nombre },
    (e, v) => e.Nombre = v,
    "Categoria de Insumo"
));

builder.Services.AddScoped<ICatalogoService<Empaquetamiento>>(sp => new CatalogoService<Empaquetamiento>(
    sp.GetRequiredService<IBaseRepository<Empaquetamiento>>(),
    e => new CatalogoDto { Id = e.Id, Nombre = e.Tipo },
    req => new Empaquetamiento { Tipo = req.Nombre },
    (e, v) => e.Tipo = v,
    "Empaquetamiento"
));

builder.Services.AddScoped<ICatalogoService<Ubicacion>>(sp => new CatalogoService<Ubicacion>(
    sp.GetRequiredService<IBaseRepository<Ubicacion>>(),
    e => new CatalogoDto { Id = e.Id, Nombre = e.Nombre },
    req => new Ubicacion { Nombre = req.Nombre },
    (e, v) => e.Nombre = v,
    "Ubicacion"
));

builder.Services.AddScoped<ICatalogoService<TipoCompra>>(sp => new CatalogoService<TipoCompra>(
    sp.GetRequiredService<IBaseRepository<TipoCompra>>(),
    e => new CatalogoDto { Id = e.Id, Nombre = e.Nombre },
    req => new TipoCompra { Nombre = req.Nombre },
    (e, v) => e.Nombre = v,
    "Tipo de Compra"
));

builder.Services.AddScoped<ICatalogoService<EstadoSalida>>(sp => new CatalogoService<EstadoSalida>(
    sp.GetRequiredService<IBaseRepository<EstadoSalida>>(),
    e => new CatalogoDto { Id = e.Id, Nombre = e.Nombre },
    req => new EstadoSalida { Nombre = req.Nombre },
    (e, v) => e.Nombre = v,
    "Estado de Salida"
));

builder.Services.AddScoped<ICatalogoService<EstadoProyecto>>(sp => new CatalogoService<EstadoProyecto>(
    sp.GetRequiredService<IBaseRepository<EstadoProyecto>>(),
    e => new CatalogoDto { Id = e.Id, Nombre = e.Estado },
    req => new EstadoProyecto { Estado = req.Nombre },
    (e, v) => e.Estado = v,
    "Estado de Proyecto"
));

builder.Services.AddScoped<ICatalogoService<Proveedor>>(sp => new CatalogoService<Proveedor>(
    sp.GetRequiredService<IBaseRepository<Proveedor>>(),
    e => new CatalogoDto { Id = e.Id, Nombre = e.Nombre },
    req => new Proveedor { Nombre = req.Nombre },
    (e, v) => e.Nombre = v,
    "Proveedor"
));

builder.Services.AddScoped<ICatalogoService<Personal>>(sp => new CatalogoService<Personal>(
    sp.GetRequiredService<IBaseRepository<Personal>>(),
    e => new CatalogoDto { Id = e.Id, Nombre = e.Nombre },
    req => new Personal { Nombre = req.Nombre },
    (e, v) => e.Nombre = v,
    "Personal"
));

// Servicios de dominio (interfaces → implementaciones)
builder.Services.AddScoped<IKardexService, KardexService>();
builder.Services.AddScoped<IReporteService, ReporteService>();
builder.Services.AddScoped<IInsumoService, InsumoService>();
builder.Services.AddScoped<IProyectoService, ProyectoService>();
builder.Services.AddScoped<IProveedorService, ProveedorService>();

// ==========================================
// Controllers
// ==========================================
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// ==========================================
// Swagger / OpenAPI
// ==========================================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new()
    {
        Title = "UDIT Inventario API v2",
        Description = "API modernizada para la gestion de inventario - Clean Architecture + .NET 9",
        Version = "v1"
    });
});

// ==========================================
// CORS (AllowAll en dev, restrictivo en prod)
// ==========================================
builder.Services.AddCors(options =>
{
    if (builder.Environment.IsDevelopment())
    {
        options.AddPolicy("CorsPolicy", policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
    }
    else
    {
        var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
                            ?? new[] { "http://localhost:3000" };
        options.AddPolicy("CorsPolicy", policy =>
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
    }
});

// ==========================================
// Health Checks
// ==========================================
builder.Services.AddHealthChecks();

var app = builder.Build();

// ==========================================
// Middleware Pipeline
// ==========================================

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("CorsPolicy");

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

// ==========================================
// Auto-migrate + Seed (Development)
// ==========================================
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();

    // Seed de roles y admin por defecto
    await DbInitializer.SeedAsync(scope.ServiceProvider);
}

app.Run();
