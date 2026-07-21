using Domain.Entities;
using Domain.Entities.Catalogos;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure.Data
{
    /// <summary>
    /// Inicializa la base de datos con los roles, usuario admin por defecto,
    /// y datos iniciales de catálogos para que la aplicación sea funcional.
    /// Se ejecuta al iniciar la aplicación en Development.
    /// Es idempotente: solo inserta si las tablas están vacías.
    /// </summary>
    public static class DbInitializer
    {
        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // ==========================================
            // 1. ROLES
            // ==========================================
            string[] roles = { "Admin", "Developer", "Assistant", "User" };
            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole(role));
                }
            }

            // ==========================================
            // 2. USUARIO ADMIN
            // ==========================================
            var adminEmail = "admin@udit-inventario.com";
            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            if (adminUser == null)
            {
                adminUser = new ApplicationUser
                {
                    UserName = "admin",
                    Email = adminEmail,
                    NombreCompleto = "Administrador UDIT",
                    Activo = true,
                    FechaCreacion = DateTime.UtcNow,
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(adminUser, "Admin2026!");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                }
            }

            // ==========================================
            // 3. CATÁLOGOS — solo si están vacíos (idempotente)
            // ==========================================

            // 3a. CategoriaInsumo
            if (!await db.CategoriaInsumos.AnyAsync())
            {
                db.CategoriaInsumos.AddRange(
                    new CategoriaInsumo { Nombre = "Eléctricos y electrónicos" },
                    new CategoriaInsumo { Nombre = "Oficina y papelería" },
                    new CategoriaInsumo { Nombre = "Limpieza y aseo" },
                    new CategoriaInsumo { Nombre = "Ferretería y construcción" },
                    new CategoriaInsumo { Nombre = "Computación y redes" },
                    new CategoriaInsumo { Nombre = "Mobiliario y equipo" },
                    new CategoriaInsumo { Nombre = "Herramientas y taller" },
                    new CategoriaInsumo { Nombre = "Seguridad industrial" }
                );
            }

            // 3b. Empaquetamiento
            if (!await db.Empaquetamientos.AnyAsync())
            {
                db.Empaquetamientos.AddRange(
                    new Empaquetamiento { Tipo = "Unidad" },
                    new Empaquetamiento { Tipo = "Caja" },
                    new Empaquetamiento { Tipo = "Paquete" },
                    new Empaquetamiento { Tipo = "Metro" },
                    new Empaquetamiento { Tipo = "Litro" },
                    new Empaquetamiento { Tipo = "Kilogramo" },
                    new Empaquetamiento { Tipo = "Rollo" },
                    new Empaquetamiento { Tipo = "Par" },
                    new Empaquetamiento { Tipo = "Galón" },
                    new Empaquetamiento { Tipo = "Resma" }
                );
            }

            // 3c. Ubicacion
            if (!await db.Ubicaciones.AnyAsync())
            {
                db.Ubicaciones.AddRange(
                    new Ubicacion { Nombre = "Bodega Principal - Edificio A" },
                    new Ubicacion { Nombre = "Bodega Secundaria - Edificio B" },
                    new Ubicacion { Nombre = "Oficina 101 - Administración" },
                    new Ubicacion { Nombre = "Oficina 102 - Sistemas" },
                    new Ubicacion { Nombre = "Taller de mantenimiento" },
                    new Ubicacion { Nombre = "Almacén de insumos críticos" },
                    new Ubicacion { Nombre = "Recepción y despachos" },
                    new Ubicacion { Nombre = "Sala de servidores" }
                );
            }

            // 3d. TipoCompra
            if (!await db.TiposCompra.AnyAsync())
            {
                db.TiposCompra.AddRange(
                    new TipoCompra { Nombre = "Contado" },
                    new TipoCompra { Nombre = "Crédito 30 días" },
                    new TipoCompra { Nombre = "Crédito 60 días" },
                    new TipoCompra { Nombre = "Donación" },
                    new TipoCompra { Nombre = "Transferencia" },
                    new TipoCompra { Nombre = "Compra directa" },
                    new TipoCompra { Nombre = "Licitación" }
                );
            }

            // 3e. EstadoSalida
            if (!await db.EstadosSalida.AnyAsync())
            {
                db.EstadosSalida.AddRange(
                    new EstadoSalida { Nombre = "Entregado" },
                    new EstadoSalida { Nombre = "Pendiente" },
                    new EstadoSalida { Nombre = "En proceso" },
                    new EstadoSalida { Nombre = "Cancelado" },
                    new EstadoSalida { Nombre = "Devuelto" }
                );
            }

            // 3f. EstadoProyecto
            if (!await db.EstadosProyecto.AnyAsync())
            {
                db.EstadosProyecto.AddRange(
                    new EstadoProyecto { Estado = "Activo" },
                    new EstadoProyecto { Estado = "Finalizado" },
                    new EstadoProyecto { Estado = "Suspendido" },
                    new EstadoProyecto { Estado = "En planeación" },
                    new EstadoProyecto { Estado = "Cancelado" }
                );
            }

            // 3g. Proveedor
            if (!await db.Proveedores.AnyAsync())
            {
                db.Proveedores.AddRange(
                    new Proveedor { Nombre = "Proveedor Genérico", Contacto = "N/A", Direccion = "N/A" },
                    new Proveedor { Nombre = "ElectroSuministros S.A.", Contacto = "María García - 310-555-0101", Direccion = "Calle 72 #15-30, Bogotá" },
                    new Proveedor { Nombre = "Papelería Nacional Ltda.", Contacto = "Juan López - 315-555-0202", Direccion = "Carrera 13 #45-67, Bogotá" },
                    new Proveedor { Nombre = "Ferretería El Constructor", Contacto = "Carlos Ruiz - 320-555-0303", Direccion = "Avenida 1 de Mayo #20-10, Bogotá" },
                    new Proveedor { Nombre = "TechSolutions Colombia", Contacto = "Ana Martínez - 300-555-0404", Direccion = "Calle 100 #8-55, Bogotá" },
                    new Proveedor { Nombre = "Distribuciones Unidas S.A.S.", Contacto = "Pedro Sánchez - 311-555-0505", Direccion = "Carrera 7 #26-20, Bogotá" }
                );
            }

            // 3h. Personal (para asignación de insumos)
            if (!await db.Personal.AnyAsync())
            {
                db.Personal.AddRange(
                    new Personal { Nombre = "Carlos Andrés Gómez", Cargo = "Coordinador de Inventarios" },
                    new Personal { Nombre = "Diana Patricia Rojas", Cargo = "Auxiliar Administrativa" },
                    new Personal { Nombre = "Javier Ernesto Muñoz", Cargo = "Jefe de Sistemas" },
                    new Personal { Nombre = "Lorena Castillo Torres", Cargo = "Directora de Proyectos" },
                    new Personal { Nombre = "Andrés Felipe Díaz", Cargo = "Técnico de Mantenimiento" },
                    new Personal { Nombre = "Sandra Milena Vargas", Cargo = "Coordinadora de Compras" }
                );
            }

            await db.SaveChangesAsync();
        }
    }
}
