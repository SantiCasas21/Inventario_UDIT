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
using Microsoft.AspNetCore.HttpOverrides;
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
    options.Password.RequireDigit = true;           // Al menos 1 número
    options.Password.RequiredLength = 6;            // Mínimo 6 caracteres
    options.Password.RequireNonAlphanumeric = true; // Al menos 1 símbolo especial
    options.Password.RequireUppercase = true;       // Al menos 1 mayúscula
    options.Password.RequireLowercase = false;
    options.User.RequireUniqueEmail = true;

    // Bloqueo por intentos fallidos (prevención de fuerza bruta)
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// Configuración de Cookies seguras para HTTPS
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Lax;
});

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
    sp.GetRequiredService<IAuditoriaService>(),
    e => new CatalogoDto { Id = e.Id, Nombre = e.Nombre },
    req => new CategoriaInsumo { Nombre = req.Nombre },
    (e, v) => e.Nombre = v,
    "Categoria de Insumo"
));

// NOTA: Empaquetamiento se registra como servicio dedicado (IEmpaquetamientoService)
// con clasificación inteligente de familias y filtrado por categoría.

builder.Services.AddScoped<ICatalogoService<FamiliaEmpaquetamiento>>(sp => new CatalogoService<FamiliaEmpaquetamiento>(
    sp.GetRequiredService<IBaseRepository<FamiliaEmpaquetamiento>>(),
    sp.GetRequiredService<IAuditoriaService>(),
    e => new CatalogoDto { Id = e.Id, Nombre = e.Nombre },
    req => new FamiliaEmpaquetamiento { Nombre = req.Nombre },
    (e, v) => e.Nombre = v,
    "Familia de Empaquetamiento"
));

builder.Services.AddScoped<ICatalogoService<Ubicacion>>(sp => new CatalogoService<Ubicacion>(
    sp.GetRequiredService<IBaseRepository<Ubicacion>>(),
    sp.GetRequiredService<IAuditoriaService>(),
    e => new CatalogoDto { Id = e.Id, Nombre = e.Nombre },
    req => new Ubicacion { Nombre = req.Nombre },
    (e, v) => e.Nombre = v,
    "Ubicacion"
));

builder.Services.AddScoped<ICatalogoService<TipoCompra>>(sp => new CatalogoService<TipoCompra>(
    sp.GetRequiredService<IBaseRepository<TipoCompra>>(),
    sp.GetRequiredService<IAuditoriaService>(),
    e => new CatalogoDto { Id = e.Id, Nombre = e.Nombre },
    req => new TipoCompra { Nombre = req.Nombre },
    (e, v) => e.Nombre = v,
    "Tipo de Compra"
));

builder.Services.AddScoped<ICatalogoService<EstadoSalida>>(sp => new CatalogoService<EstadoSalida>(
    sp.GetRequiredService<IBaseRepository<EstadoSalida>>(),
    sp.GetRequiredService<IAuditoriaService>(),
    e => new CatalogoDto { Id = e.Id, Nombre = e.Nombre },
    req => new EstadoSalida { Nombre = req.Nombre },
    (e, v) => e.Nombre = v,
    "Estado de Salida"
));

builder.Services.AddScoped<ICatalogoService<EstadoProyecto>>(sp => new CatalogoService<EstadoProyecto>(
    sp.GetRequiredService<IBaseRepository<EstadoProyecto>>(),
    sp.GetRequiredService<IAuditoriaService>(),
    e => new CatalogoDto { Id = e.Id, Nombre = e.Estado },
    req => new EstadoProyecto { Estado = req.Nombre },
    (e, v) => e.Estado = v,
    "Estado de Proyecto"
));

builder.Services.AddScoped<ICatalogoService<Proveedor>>(sp => new CatalogoService<Proveedor>(
    sp.GetRequiredService<IBaseRepository<Proveedor>>(),
    sp.GetRequiredService<IAuditoriaService>(),
    e => new CatalogoDto { Id = e.Id, Nombre = e.Nombre },
    req => new Proveedor { Nombre = req.Nombre },
    (e, v) => e.Nombre = v,
    "Proveedor"
));

builder.Services.AddScoped<ICatalogoService<Personal>>(sp => new CatalogoService<Personal>(
    sp.GetRequiredService<IBaseRepository<Personal>>(),
    sp.GetRequiredService<IAuditoriaService>(),
    e => new CatalogoDto { Id = e.Id, Nombre = e.Nombre },
    req => new Personal { Nombre = req.Nombre },
    (e, v) => e.Nombre = v,
    "Personal"
));

// Servicios de dominio (interfaces → implementaciones)
builder.Services.AddScoped<IEmpaquetamientoService, EmpaquetamientoService>();
builder.Services.AddScoped<IKardexService, KardexService>();
builder.Services.AddScoped<IReporteService, ReporteService>();
builder.Services.AddScoped<IInsumoService, InsumoService>();
builder.Services.AddScoped<IProyectoService, ProyectoService>();
builder.Services.AddScoped<IProveedorService, ProveedorService>();
builder.Services.AddScoped<IAuditoriaService, AuditoriaService>();
builder.Services.AddScoped<IUserManagementService, UserManagementService>();
builder.Services.AddScoped<IExcelParserService, ExcelParserService>();

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
        var configuredOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
        options.AddPolicy("CorsPolicy", policy =>
        {
            policy.SetIsOriginAllowed(origin =>
                   {
                       if (string.IsNullOrWhiteSpace(origin)) return false;
                       try
                       {
                           var uri = new Uri(origin);
                           return uri.Host == "localhost" || 
                                  uri.Host == "127.0.0.1" || 
                                  uri.Host.StartsWith("172.") || 
                                  uri.Host.EndsWith("udit.edu.co") || 
                                  configuredOrigins.Contains(origin);
                       }
                       catch
                       {
                           return false;
                       }
                   })
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
    }
});

// ==========================================
// Reverse Proxy & SSL / TLS Forwarded Headers
// ==========================================
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// ==========================================
// HSTS (HTTP Strict Transport Security) en Producción
// ==========================================
builder.Services.AddHsts(options =>
{
    options.Preload = true;
    options.IncludeSubDomains = true;
    options.MaxAge = TimeSpan.FromDays(365); // 1 año recomendado para SSL
});

// ==========================================
// Health Checks
// ==========================================
builder.Services.AddHealthChecks();

var app = builder.Build();

// ==========================================
// Middleware Pipeline
// ==========================================

// 1. Forwarded Headers DEBE ir al inicio antes de redirecciones para procesar X-Forwarded-Proto
app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    // Forzar HTTP Strict Transport Security solo si está habilitado en configuración
    // (Se mantiene en false para certificados autofirmados / IP para permitir el bypass del navegador)
    if (app.Configuration.GetValue<bool>("Security:EnableHsts", false))
    {
        app.UseHsts();
    }
}

app.UseHttpsRedirection();
app.UseCors("CorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");

// ==========================================
// Auto-migrate + Seed (Development & Production)
// ==========================================
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();

    // Seed de roles y admin por defecto
    await DbInitializer.SeedAsync(scope.ServiceProvider);

    // Clasificación inteligente de empaquetamientos sin familia (idempotente)
    var empaquetamientoService = scope.ServiceProvider.GetRequiredService<IEmpaquetamientoService>();
    await empaquetamientoService.ClasificarPendientesAsync();
}
catch (Exception ex)
{
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogError(ex, "Error durante la migración o inicialización de la base de datos.");
}

app.Run();

