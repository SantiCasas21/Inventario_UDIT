using Application.Common.Interfaces;
using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;
using Domain.Entities;
using Microsoft.AspNetCore.Http;
using System.Linq.Expressions;

namespace Application.Services
{
    public class AuditoriaService : IAuditoriaService
    {
        private readonly IBaseRepository<Auditoria> _repository;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IBaseRepository<Insumo> _insumoRepo;
        private readonly IBaseRepository<MovimientoInventario> _movimientoRepo;

        public AuditoriaService(
            IBaseRepository<Auditoria> repository, 
            IHttpContextAccessor httpContextAccessor,
            IBaseRepository<Insumo> insumoRepo,
            IBaseRepository<MovimientoInventario> movimientoRepo)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
            _insumoRepo = insumoRepo;
            _movimientoRepo = movimientoRepo;
        }

        public async Task LogAsync(string accion, string modulo, string detalles, string? usuario = null)
        {
            if (string.IsNullOrWhiteSpace(usuario))
            {
                var userClaims = _httpContextAccessor.HttpContext?.User;
                usuario = userClaims?.Identity?.Name ?? "Sistema";
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

            if (!string.IsNullOrWhiteSpace(modulo) && !string.IsNullOrWhiteSpace(textSearch))
            {
                var search = textSearch.ToLower();
                filter = a => a.Modulo == modulo && 
                              (a.Accion.ToLower().Contains(search) || 
                               a.Usuario.ToLower().Contains(search) ||
                               a.Detalles.ToLower().Contains(search));
            }
            else if (!string.IsNullOrWhiteSpace(modulo))
            {
                filter = a => a.Modulo == modulo;
            }
            else if (!string.IsNullOrWhiteSpace(textSearch))
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

            var dtos = paged.Items.Select(a => new AuditoriaDto
            {
                Id = a.Id,
                Fecha = a.Fecha,
                Usuario = a.Usuario,
                Accion = a.Accion,
                Modulo = a.Modulo,
                Detalles = a.Detalles
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
