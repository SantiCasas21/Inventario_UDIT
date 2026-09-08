using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Application.Services
{
    /// <summary>
    /// Implementación de IUserManagementService utilizando ASP.NET Identity.
    /// Gestiona usuarios y RBAC basado en claims de roles.
    /// </summary>
    public class UserManagementService : IUserManagementService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        /// <summary>
        /// ClaimType usado para todos los permisos de la aplicación.
        /// </summary>
        public const string PermissionClaimType = "permission";

        /// <summary>
        /// Catálogo estático de todos los permisos disponibles en el sistema.
        /// Es la fuente de verdad para la UI de gestión de roles.
        /// </summary>
        private static readonly List<PermissionDefinitionDto> _availablePermissions = new()
        {
            // Módulo: Insumos
            new() { Value = "insumos.ver",                 Label = "Ver Insumos",                 Module = "Insumos",                 Description = "Visualizar lista y detalle de insumos del inventario" },
            new() { Value = "insumos.crear",                Label = "Crear Insumos",               Module = "Insumos",                 Description = "Registrar nuevos insumos en el sistema" },
            new() { Value = "insumos.editar",               Label = "Editar Insumos",              Module = "Insumos",                 Description = "Modificar información de insumos existentes" },
            new() { Value = "insumos.eliminar",             Label = "Eliminar Insumos",            Module = "Insumos",                 Description = "Eliminar insumos del sistema" },
            new() { Value = "insumos.unificar",             Label = "Unificar Insumos Duplicados", Module = "Insumos",                 Description = "Unificar insumos duplicados y consolidar existencias e historial" },


            // Módulo: Movimientos
            new() { Value = "movimientos.ver",              Label = "Ver Movimientos",              Module = "Movimientos",             Description = "Ver el Kardex de movimientos de inventario" },
            new() { Value = "movimientos.crear",            Label = "Registrar Movimientos",        Module = "Movimientos",             Description = "Registrar ingresos y salidas de inventario" },
            new() { Value = "movimientos.ajuste",           Label = "Realizar Ajustes",            Module = "Movimientos",             Description = "Ejecutar ajustes de stock en el inventario" },

            // Módulo: Reportes
            new() { Value = "reportes.ver",                 Label = "Ver Reportes",                Module = "Reportes",                Description = "Acceder al centro de reportes y consultas analíticas" },
            new() { Value = "reportes.exportar",            Label = "Exportar Reportes (Excel)",    Module = "Reportes",                Description = "Descargar reportes tabulares en formato Excel (.xlsx)" },

            // Módulo: Catálogos Maestros (Granular por catálogo)
            new() { Value = "catalogos.categorias.ver",     Label = "Ver Categorías",              Module = "Catálogos Maestros",      Description = "Consultar categorías de insumos" },
            new() { Value = "catalogos.categorias.gestionar",Label = "Gestionar Categorías",        Module = "Catálogos Maestros",      Description = "Crear, editar y eliminar categorías" },

            new() { Value = "catalogos.unidades.ver",       Label = "Ver Unidades de Medida",      Module = "Catálogos Maestros",      Description = "Consultar unidades de medida" },
            new() { Value = "catalogos.unidades.gestionar",  Label = "Gestionar Unidades de Medida", Module = "Catálogos Maestros",      Description = "Crear, editar y eliminar unidades de medida" },

            new() { Value = "catalogos.empaquetamiento.ver",Label = "Ver Empaquetamiento",         Module = "Catálogos Maestros",      Description = "Consultar tipos de empaque" },
            new() { Value = "catalogos.empaquetamiento.gestionar", Label = "Gestionar Empaquetamiento", Module = "Catálogos Maestros", Description = "Crear, editar y eliminar empaquetamientos" },

            new() { Value = "catalogos.ubicaciones.ver",    Label = "Ver Ubicaciones",             Module = "Catálogos Maestros",      Description = "Consultar ubicaciones físicas del almacén" },
            new() { Value = "catalogos.ubicaciones.gestionar", Label = "Gestionar Ubicaciones",     Module = "Catálogos Maestros",      Description = "Crear, editar y eliminar ubicaciones" },

            new() { Value = "catalogos.proveedores.ver",    Label = "Ver Proveedores",             Module = "Catálogos Maestros",      Description = "Consultar proveedores registrados" },
            new() { Value = "catalogos.proveedores.gestionar", Label = "Gestionar Proveedores",     Module = "Catálogos Maestros",      Description = "Crear, editar y eliminar proveedores" },

            new() { Value = "catalogos.proyectos.ver",      Label = "Ver Proyectos",               Module = "Catálogos Maestros",      Description = "Consultar proyectos y obras" },
            new() { Value = "catalogos.proyectos.gestionar",Label = "Gestionar Proyectos",         Module = "Catálogos Maestros",      Description = "Crear, editar y eliminar proyectos" },

            new() { Value = "catalogos.tipocompra.ver",     Label = "Ver Tipos de Compra",         Module = "Catálogos Maestros",      Description = "Consultar modalidades de compra" },
            new() { Value = "catalogos.tipocompra.gestionar", Label = "Gestionar Tipos de Compra",  Module = "Catálogos Maestros",      Description = "Crear, editar y eliminar tipos de compra" },

            new() { Value = "catalogos.estadoproyecto.ver", Label = "Ver Estados de Proyecto",     Module = "Catálogos Maestros",      Description = "Consultar estados de proyectos" },
            new() { Value = "catalogos.estadoproyecto.gestionar", Label = "Gestionar Estados de Proyecto", Module = "Catálogos Maestros", Description = "Crear y editar estados de proyectos" },


            new() { Value = "catalogos.estadosalida.ver",   Label = "Ver Estados de Salida",       Module = "Catálogos Maestros",      Description = "Consultar estados de salida" },
            new() { Value = "catalogos.estadosalida.gestionar", Label = "Gestionar Estados de Salida", Module = "Catálogos Maestros",   Description = "Crear y editar estados de salida" },

            // Módulo: Sistema y Control
            new() { Value = "usuarios.ver",                 Label = "Ver Usuarios",                 Module = "Sistema y Control",       Description = "Ver la lista de usuarios del sistema" },
            new() { Value = "usuarios.gestionar",           Label = "Gestionar Usuarios",           Module = "Sistema y Control",       Description = "Crear, activar y desactivar usuarios del sistema" },
            new() { Value = "roles.gestionar",              Label = "Gestionar Roles y Permisos",   Module = "Sistema y Control",       Description = "Editar los permisos asignados a cada rol (RBAC)" },
            new() { Value = "auditoria.ver",                Label = "Ver Auditoría / Logs",         Module = "Sistema y Control",       Description = "Consultar el log de auditoría de acciones del sistema" },
        };


        private readonly IAuditoriaService _auditoriaService;

        public UserManagementService(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IAuditoriaService auditoriaService)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _auditoriaService = auditoriaService;
        }


        // ── Gestión de usuarios ───────────────────────────────────────────────

        public async Task<OperationResult<IEnumerable<UserDto>>> GetAllAsync()
        {
            // Regla de negocio: purga automática de usuarios desactivados que hayan cumplido 30 días en ese estado
            var thresholdDate = DateTime.UtcNow.AddDays(-30);
            var expiredUsers = await _userManager.Users
                .Where(u => !u.Activo && u.FechaDesactivacion != null && u.FechaDesactivacion <= thresholdDate)
                .ToListAsync();

            foreach (var exp in expiredUsers)
            {
                var username = exp.UserName ?? "desconocido";
                await _userManager.DeleteAsync(exp);
                await _auditoriaService.LogAsync("ELIMINAR", "Usuarios", $"Eliminación automática del usuario '{username}' tras permanecer 30 días desactivado");
            }

            var users = await _userManager.Users
                .OrderBy(u => u.UserName)
                .ToListAsync();

            var dtos = new List<UserDto>();
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                int? diasRestantes = null;
                if (!user.Activo && user.FechaDesactivacion.HasValue)
                {
                    var diasPasados = (DateTime.UtcNow - user.FechaDesactivacion.Value).TotalDays;
                    diasRestantes = Math.Max(0, 30 - (int)Math.Floor(diasPasados));
                }

                dtos.Add(new UserDto
                {
                    Id = user.Id,
                    Username = user.UserName ?? "",
                    Email = user.Email ?? "",
                    NombreCompleto = user.NombreCompleto,
                    Role = roles.FirstOrDefault() ?? "User",
                    AvatarUrl = user.AvatarUrl,
                    Activo = user.Activo,
                    DebeCambiarPassword = user.DebeCambiarPassword,
                    FechaDesactivacion = user.FechaDesactivacion,
                    DiasRestantesEliminacion = diasRestantes,
                    FechaCreacion = user.FechaCreacion
                });
            }

            return OperationResult<IEnumerable<UserDto>>.Ok(dtos);
        }

        public async Task<OperationResult<UserDto>> GetByIdAsync(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return OperationResult<UserDto>.Fail("Usuario no encontrado");

            var roles = await _userManager.GetRolesAsync(user);
            int? diasRestantes = null;
            if (!user.Activo && user.FechaDesactivacion.HasValue)
            {
                var diasPasados = (DateTime.UtcNow - user.FechaDesactivacion.Value).TotalDays;
                diasRestantes = Math.Max(0, 30 - (int)Math.Floor(diasPasados));
            }

            var dto = new UserDto
            {
                Id = user.Id,
                Username = user.UserName ?? "",
                Email = user.Email ?? "",
                NombreCompleto = user.NombreCompleto,
                Role = roles.FirstOrDefault() ?? "User",
                AvatarUrl = user.AvatarUrl,
                Activo = user.Activo,
                DebeCambiarPassword = user.DebeCambiarPassword,
                FechaDesactivacion = user.FechaDesactivacion,
                DiasRestantesEliminacion = diasRestantes,
                FechaCreacion = user.FechaCreacion
            };

            return OperationResult<UserDto>.Ok(dto);
        }

        public async Task<OperationResult<UserDto>> CreateUserAsync(CreateUserAdminDto request, string? creatorUsername = null)
        {
            if (string.IsNullOrWhiteSpace(request.Username))
                return OperationResult<UserDto>.Fail("El nombre de usuario es obligatorio");

            if (string.IsNullOrWhiteSpace(request.Email))
                return OperationResult<UserDto>.Fail("El correo electrónico es obligatorio");

            var existingUser = await _userManager.FindByNameAsync(request.Username.Trim());
            if (existingUser != null)
                return OperationResult<UserDto>.Fail($"El nombre de usuario '{request.Username}' ya está en uso");

            var existingEmail = await _userManager.FindByEmailAsync(request.Email.Trim());
            if (existingEmail != null)
                return OperationResult<UserDto>.Fail($"El correo electrónico '{request.Email}' ya está registrado por otra cuenta");

            var roleToAssign = string.IsNullOrWhiteSpace(request.Role) ? "User" : request.Role.Trim();
            if (!await _roleManager.RoleExistsAsync(roleToAssign))
                return OperationResult<UserDto>.Fail($"El rol '{roleToAssign}' no es válido");

            const string defaultTempPassword = "Udit2026!";

            var user = new ApplicationUser
            {
                UserName = request.Username.Trim(),
                Email = request.Email.Trim(),
                NombreCompleto = string.IsNullOrWhiteSpace(request.NombreCompleto) ? request.Username.Trim() : request.NombreCompleto.Trim(),
                Activo = true,
                DebeCambiarPassword = true,
                FechaCreacion = DateTime.UtcNow,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, defaultTempPassword);
            if (!result.Succeeded)
            {
                var errors = string.Join(" ", result.Errors.Select(e => e.Description));
                return OperationResult<UserDto>.Fail($"Error al crear usuario: {errors}");
            }

            await _userManager.AddToRoleAsync(user, roleToAssign);

            var adminWhoCreated = !string.IsNullOrWhiteSpace(creatorUsername) ? creatorUsername : "Administrador";
            await _auditoriaService.LogAsync("CREAR", "Usuarios", $"El Administrador '{adminWhoCreated}' registró al nuevo usuario '{user.UserName}' ({user.NombreCompleto}) con Rol '{roleToAssign}' (Contraseña temporal asignada)");

            var dto = new UserDto
            {
                Id = user.Id,
                Username = user.UserName,
                Email = user.Email,
                NombreCompleto = user.NombreCompleto,
                Role = roleToAssign,
                AvatarUrl = user.AvatarUrl,
                Activo = user.Activo,
                DebeCambiarPassword = user.DebeCambiarPassword,
                FechaCreacion = user.FechaCreacion
            };

            return OperationResult<UserDto>.Ok(dto, $"Usuario '{user.UserName}' registrado exitosamente con contraseña temporal.");
        }


        public async Task<OperationResult> UpdateUserRoleAsync(string id, string newRole)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return OperationResult.Fail("Usuario no encontrado");

            if (string.IsNullOrWhiteSpace(newRole) || !await _roleManager.RoleExistsAsync(newRole))
                return OperationResult.Fail($"El rol '{newRole}' no es válido");

            var currentRoles = await _userManager.GetRolesAsync(user);
            if (currentRoles.Any())
            {
                var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
                if (!removeResult.Succeeded)
                    return OperationResult.Fail("Error al remover los roles anteriores");
            }

            var addResult = await _userManager.AddToRoleAsync(user, newRole);
            if (!addResult.Succeeded)
                return OperationResult.Fail("Error al asignar el nuevo rol");

            await _auditoriaService.LogAsync("EDITAR", "Usuarios", $"Se cambió el rol del usuario '{user.UserName}' a '{newRole}'");

            return OperationResult.Ok($"Rol de '{user.UserName}' actualizado a '{newRole}' exitosamente");
        }


        public async Task<OperationResult> DeactivateAsync(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return OperationResult.Fail("Usuario no encontrado");

            if (!user.Activo)
                return OperationResult.Fail("El usuario ya está inactivo");

            user.Activo = false;
            user.FechaDesactivacion = DateTime.UtcNow;
            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
                return OperationResult.Fail("Error al desactivar usuario");

            await _auditoriaService.LogAsync("DESACTIVAR", "Usuarios", $"Se desactivó el usuario '{user.UserName}' (se eliminará automáticamente tras 30 días de inactividad)");

            return OperationResult.Ok($"Usuario '{user.UserName}' desactivado exitosamente. Se eliminará automáticamente en 30 días si no se reactiva.");
        }

        public async Task<OperationResult> ActivateAsync(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return OperationResult.Fail("Usuario no encontrado");

            if (user.Activo)
                return OperationResult.Fail("El usuario ya está activo");

            user.Activo = true;
            user.FechaDesactivacion = null;
            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
                return OperationResult.Fail("Error al activar usuario");

            await _auditoriaService.LogAsync("ACTIVAR", "Usuarios", $"Se reactivó el usuario '{user.UserName}'");

            return OperationResult.Ok($"Usuario '{user.UserName}' activado exitosamente");
        }


        public async Task<OperationResult> DeleteAsync(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return OperationResult.Fail("Usuario no encontrado");

            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
                return OperationResult.Fail("Error al eliminar usuario");

            return OperationResult.Ok($"Usuario '{user.UserName}' eliminado permanentemente");
        }

        // ── RBAC: Gestión de roles y permisos ────────────────────────────────

        public IEnumerable<PermissionDefinitionDto> GetAvailablePermissions()
            => _availablePermissions.AsReadOnly();

        public async Task<OperationResult<IEnumerable<RolePermissionsDto>>> GetAllRolesPermissionsAsync()
        {
            var roles = await _roleManager.Roles.OrderBy(r => r.Name).ToListAsync();
            var validValues = _availablePermissions.Select(p => p.Value).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var result = new List<RolePermissionsDto>();

            foreach (var role in roles)
            {
                var claims = await _roleManager.GetClaimsAsync(role);
                result.Add(new RolePermissionsDto
                {
                    RoleName = role.Name ?? string.Empty,
                    Permissions = claims
                        .Where(c => c.Type == PermissionClaimType && validValues.Contains(c.Value))
                        .Select(c => c.Value)
                        .OrderBy(v => v)
                        .ToList()
                });
            }

            return OperationResult<IEnumerable<RolePermissionsDto>>.Ok(result);
        }

        public async Task<OperationResult<RolePermissionsDto>> GetRolePermissionsAsync(string roleName)
        {
            var role = await _roleManager.FindByNameAsync(roleName);
            if (role == null)
                return OperationResult<RolePermissionsDto>.Fail($"Rol '{roleName}' no encontrado");

            var validValues = _availablePermissions.Select(p => p.Value).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var claims = await _roleManager.GetClaimsAsync(role);
            var dto = new RolePermissionsDto
            {
                RoleName = role.Name ?? string.Empty,
                Permissions = claims
                    .Where(c => c.Type == PermissionClaimType && validValues.Contains(c.Value))
                    .Select(c => c.Value)
                    .OrderBy(v => v)
                    .ToList()
            };

            return OperationResult<RolePermissionsDto>.Ok(dto);
        }

        public async Task<OperationResult> UpdateRolePermissionsAsync(string roleName, IEnumerable<string> permissions)
        {
            // Admin siempre conserva todos los permisos — protección contra lockout
            if (roleName.Equals("Admin", StringComparison.OrdinalIgnoreCase))
                return OperationResult.Fail("Los permisos del rol Admin no pueden modificarse para evitar bloqueo del sistema.");

            var role = await _roleManager.FindByNameAsync(roleName);
            if (role == null)
                return OperationResult.Fail($"Rol '{roleName}' no encontrado");

            // Filtrar y sanear únicamente los permisos válidos del catálogo activo
            var validValues = _availablePermissions.Select(p => p.Value).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var cleanPermissions = permissions.Where(p => validValues.Contains(p)).Distinct(StringComparer.OrdinalIgnoreCase).ToList();

            // Operación atómica: eliminar claims actuales e insertar los nuevos
            var existingClaims = await _roleManager.GetClaimsAsync(role);
            var permissionClaims = existingClaims.Where(c => c.Type == PermissionClaimType).ToList();

            foreach (var claim in permissionClaims)
            {
                var removeResult = await _roleManager.RemoveClaimAsync(role, claim);
                if (!removeResult.Succeeded)
                    return OperationResult.Fail($"Error al limpiar permisos previos: {string.Join(", ", removeResult.Errors.Select(e => e.Description))}");
            }

            foreach (var permission in cleanPermissions)
            {
                var addResult = await _roleManager.AddClaimAsync(role, new Claim(PermissionClaimType, permission));
                if (!addResult.Succeeded)
                    return OperationResult.Fail($"Error al asignar permiso '{permission}': {string.Join(", ", addResult.Errors.Select(e => e.Description))}");
            }

            return OperationResult.Ok();
        }

        public async Task<bool> UserHasPermissionAsync(string userId, string permission)
        {
            if (string.IsNullOrWhiteSpace(userId)) return false;

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null || !user.Activo) return false;

            var roles = await _userManager.GetRolesAsync(user);
            if (roles.Contains("Admin", StringComparer.OrdinalIgnoreCase)) return true;

            foreach (var roleName in roles)
            {
                var role = await _roleManager.FindByNameAsync(roleName);
                if (role != null)
                {
                    var claims = await _roleManager.GetClaimsAsync(role);
                    if (claims.Any(c => c.Type == PermissionClaimType && c.Value.Equals(permission, StringComparison.OrdinalIgnoreCase)))
                    {
                        return true;
                    }
                }
            }
            return false;
        }
    }
}


