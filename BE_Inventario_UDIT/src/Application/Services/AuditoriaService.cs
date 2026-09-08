using Application.Common.Interfaces;
using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Application.Services
{
    public class AuditoriaService : IAuditoriaService
    {
        private readonly IBaseRepository<Auditoria> _repository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IBaseRepository<Insumo> _insumoRepo;
        private readonly IBaseRepository<MovimientoInventario> _movimientoRepo;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public AuditoriaService(
            IBaseRepository<Auditoria> repository, 
            IHttpContextAccessor httpContextAccessor,
            IBaseRepository<Insumo> insumoRepo,
            IBaseRepository<MovimientoInventario> movimientoRepo,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
            _insumoRepo = insumoRepo;
            _movimientoRepo = movimientoRepo;
            _userManager = userManager;
            _roleManager = roleManager;
        }

        public async Task LogAsync(string accion, string modulo, string detalles, string? usuario = null)
        {
            if (string.IsNullOrWhiteSpace(usuario))
            {
                var userClaims = _httpContextAccessor.HttpContext?.User;
                usuario = userClaims?.Identity?.Name ?? "Sistema";
            }

            // Prevenir duplicación exacta de logs en una ventana de 5 segundos
            var recentThreshold = DateTime.UtcNow.AddSeconds(-5);
            var isDuplicate = await _repository.CountAsync(a =>
                a.Usuario == usuario &&
                a.Accion == accion &&
                a.Modulo == modulo &&
                a.Detalles == detalles &&
                a.Fecha >= recentThreshold);

            if (isDuplicate > 0)
            {
                return;
            }

            var auditoria = new Auditoria
            {
                Fecha = DateTime.UtcNow,
                Usuario = usuario,
                Accion = accion,
                Modulo = modulo,
                Detalles = detalles
            };

            await _repository.AddAsync(auditoria);
        }

        public async Task<PagedResult<AuditoriaDto>> GetLogsAsync(int page = 1, int pageSize = 20, string textSearch = "", string modulo = "")
        {
            Expression<Func<Auditoria, bool>>? filter = null;
            var hasModulo = !string.IsNullOrWhiteSpace(modulo);
            var hasSearch = !string.IsNullOrWhiteSpace(textSearch);

            if (hasModulo && hasSearch)
            {
                var search = textSearch.ToLower();
                var mod = modulo.Trim().ToLower();
                filter = a => (a.Modulo.ToLower().Contains(mod) || 
                              (mod.StartsWith("proyecto") && a.Modulo.ToLower().Contains("proyecto")) ||
                              (mod.StartsWith("usuario") && a.Modulo.ToLower().Contains("usuario")) ||
                              (mod.StartsWith("insumo") && a.Modulo.ToLower().Contains("insumo")) ||
                              (mod.StartsWith("movimiento") && a.Modulo.ToLower().Contains("movimiento")) ||
                              (mod.StartsWith("proveedor") && a.Modulo.ToLower().Contains("proveedor")) ||
                              (mod.StartsWith("personal") && a.Modulo.ToLower().Contains("personal")) ||
                              (mod.StartsWith("empaquetamiento") && a.Modulo.ToLower().Contains("empaquetamiento")) ||
                              ((mod.StartsWith("catálogo") || mod.StartsWith("catalogo")) && (a.Modulo.ToLower().Contains("categoria") || a.Modulo.ToLower().Contains("estado") || a.Modulo.ToLower().Contains("tipo") || a.Modulo.ToLower().Contains("ubicacion") || a.Modulo.ToLower().Contains("unidad") || a.Modulo.ToLower().Contains("familia")))) &&
                              (a.Accion.ToLower().Contains(search) || 
                               a.Usuario.ToLower().Contains(search) ||
                               a.Detalles.ToLower().Contains(search));
            }
            else if (hasModulo)
            {
                var mod = modulo.Trim().ToLower();
                filter = a => a.Modulo.ToLower().Contains(mod) || 
                              (mod.StartsWith("proyecto") && a.Modulo.ToLower().Contains("proyecto")) ||
                              (mod.StartsWith("usuario") && a.Modulo.ToLower().Contains("usuario")) ||
                              (mod.StartsWith("insumo") && a.Modulo.ToLower().Contains("insumo")) ||
                              (mod.StartsWith("movimiento") && a.Modulo.ToLower().Contains("movimiento")) ||
                              (mod.StartsWith("proveedor") && a.Modulo.ToLower().Contains("proveedor")) ||
                              (mod.StartsWith("personal") && a.Modulo.ToLower().Contains("personal")) ||
                              (mod.StartsWith("empaquetamiento") && a.Modulo.ToLower().Contains("empaquetamiento")) ||
                              ((mod.StartsWith("catálogo") || mod.StartsWith("catalogo")) && (a.Modulo.ToLower().Contains("categoria") || a.Modulo.ToLower().Contains("estado") || a.Modulo.ToLower().Contains("tipo") || a.Modulo.ToLower().Contains("ubicacion") || a.Modulo.ToLower().Contains("unidad") || a.Modulo.ToLower().Contains("familia")));
            }
            else if (hasSearch)
            {
                var search = textSearch.ToLower();
                filter = a => a.Accion.ToLower().Contains(search) || 
                              a.Usuario.ToLower().Contains(search) ||
                              a.Detalles.ToLower().Contains(search);
            }

            var paged = await _repository.GetPagedAsync(
                page, 
                pageSize, 
                filter: filter, 
                orderBy: q => q.OrderByDescending(a => a.Fecha));

            // P-04: Traer solo usuarios presentes en la página actual y sus roles sin N+1
            var distinctUsernames = paged.Items
                .Select(a => a.Usuario)
                .Where(u => !string.IsNullOrWhiteSpace(u))
                .Distinct()
                .ToList();

            var userRolesMap = new Dictionary<string, (string role, string? avatar)>(StringComparer.OrdinalIgnoreCase);

            if (distinctUsernames.Count > 0)
            {
                var users = await _userManager.Users
                    .Where(u => distinctUsernames.Contains(u.UserName!))
                    .Select(u => new { u.Id, u.UserName, u.AvatarUrl })
                    .ToListAsync();

                var userIds = users.Select(u => u.Id).ToList();

                var userRoles = await _userManager.Users
                    .Where(u => userIds.Contains(u.Id))
                    .SelectMany(u => u.UserRoles.Select(ur => new { UserId = ur.UserId, RoleId = ur.RoleId }))
                    .ToListAsync();

                var allRoles = await _roleManager.Roles
                    .Select(r => new { r.Id, r.Name })
                    .ToListAsync();

                var roleDict = allRoles.ToDictionary(r => r.Id, r => r.Name ?? "User");
                var userRoleDict = userRoles
                    .GroupBy(ur => ur.UserId)
                    .ToDictionary(g => g.Key, g => roleDict.GetValueOrDefault(g.First().RoleId) ?? "User");

                foreach (var u in users)
                {
                    if (!string.IsNullOrWhiteSpace(u.UserName))
                    {
                        var roleName = userRoleDict.GetValueOrDefault(u.Id) ?? "User";
                        userRolesMap[u.UserName] = (roleName, u.AvatarUrl);
                    }
                }
            }

            var dtos = paged.Items.Select(a =>
            {
                string? role = null;
                string? avatarUrl = null;

                if (!string.IsNullOrWhiteSpace(a.Usuario) && userRolesMap.TryGetValue(a.Usuario, out var uInfo))
                {
                    role = uInfo.role;
                    avatarUrl = uInfo.avatar;
                }
                else if (a.Usuario.Contains("Admin", StringComparison.OrdinalIgnoreCase))
                {
                    role = "Admin";
                }
                else if (a.Usuario.Contains("Developer", StringComparison.OrdinalIgnoreCase) || a.Usuario.Contains("Dev", StringComparison.OrdinalIgnoreCase))
                {
                    role = "Developer";
                }
                else if (a.Usuario.Contains("Assistant", StringComparison.OrdinalIgnoreCase) || a.Usuario.Contains("Asistente", StringComparison.OrdinalIgnoreCase))
                {
                    role = "Assistant";
                }

                return new AuditoriaDto
                {
                    Id = a.Id,
                    Fecha = a.Fecha,
                    Usuario = a.Usuario,
                    Rol = role,
                    AvatarUrl = avatarUrl,
                    Accion = a.Accion,
                    Modulo = a.Modulo,
                    Detalles = a.Detalles
                };
            }).ToList();

            return new PagedResult<AuditoriaDto>
            {
                Page = paged.Page,
                PageSize = paged.PageSize,
                TotalCount = paged.TotalCount,
                Items = dtos
            };
        }


        public async Task SeedHistoricalDataAsync()
        {
            var existingLogs = await _repository.CountAsync();
            if (existingLogs > 0) return; // Only seed if empty

            var insumos = await _insumoRepo.GetAllAsync();
            foreach (var insumo in insumos)
            {
                await _repository.AddAsync(new Auditoria
                {
                    Fecha = DateTime.UtcNow.AddMonths(-1), // mock historical date
                    Usuario = "Sistema (Histórico)",
                    Accion = "CREAR",
                    Modulo = "Insumos",
                    Detalles = $"Se creó el insumo '{insumo.CodigoFabrica}' (ID {insumo.Id})"
                });
            }

            var movimientos = await _movimientoRepo.GetAllAsync();
            foreach (var mov in movimientos)
            {
                string accion = mov.TipoMovimiento == Domain.Enums.TipoMovimiento.Ingreso ? "INGRESO" :
                                mov.TipoMovimiento == Domain.Enums.TipoMovimiento.Salida ? "SALIDA" :
                                mov.TipoMovimiento == Domain.Enums.TipoMovimiento.Ajuste ? "AJUSTE" : "UNIFICAR";

                string detalles = "";
                if (accion == "INGRESO") detalles = $"Se ingresaron {mov.Cantidad} unidades al insumo ID {mov.IdInsumo}";
                else if (accion == "SALIDA") detalles = $"Se sacaron {mov.Cantidad} unidades del insumo ID {mov.IdInsumo}";
                else if (accion == "AJUSTE") detalles = $"Se ajustó {mov.Cantidad} unidades en el insumo ID {mov.IdInsumo}";
                else detalles = $"Unificación histórica en Insumo ID {mov.IdInsumo}";

                await _repository.AddAsync(new Auditoria
                {
                    Fecha = mov.Fecha,
                    Usuario = mov.UsuarioRegistro ?? "Sistema (Histórico)",
                    Accion = accion,
                    Modulo = "Movimientos",
                    Detalles = detalles
                });
            }
        }
    }
}
