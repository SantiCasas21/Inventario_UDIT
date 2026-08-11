using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    public class NotificationDto
    {
        public string Id { get; set; } = string.Empty;
        public string? Icon { get; set; }
        public string? Image { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string Time { get; set; } = string.Empty;
        public string? Link { get; set; }
        public bool UseRouter { get; set; } = true;
        public bool Read { get; set; } = false;
        public string? CodeToCopy { get; set; }
    }

    [ApiController]
    [Route("api/common/notifications")]
    [Authorize]
    public class NotificacionController : ControllerBase
    {
        private readonly IInsumoRepository _insumoRepo;
        private readonly IMovimientoRepository _movRepo;

        public NotificacionController(IInsumoRepository insumoRepo, IMovimientoRepository movRepo)
        {
            _insumoRepo = insumoRepo;
            _movRepo = movRepo;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            var notifications = new List<NotificationDto>();

            // 1. Obtener stock general y lista de insumos
            var stockGeneral = await _movRepo.GetStockGeneralDbAsync();
            var stockDict = stockGeneral.ToDictionary(s => s.IdInsumo, s => s.StockActual);

            var insumos = await _insumoRepo.GetAllAsync();

            foreach (var insumo in insumos)
            {
                int stock = stockDict.TryGetValue(insumo.Id, out int sVal) ? sVal : 0;
                int umbral = 5; // Umbral por defecto o de entidad si aplica

                if (stock == 0)
                {
                    notifications.Add(new NotificationDto
                    {
                        Id = $"no-stock-{insumo.Id}",
                        Icon = "heroicons_solid:x-circle",
                        Title = $"<span class=\"text-red-600 font-extrabold\">¡Insumo Agotado!</span>",
                        Description = $"El componente <strong>{insumo.CodigoFabrica}</strong> se ha quedado completamente sin existencias en el sistema. Te sugerimos iniciar un proceso de reabastecimiento pronto.",
                        Time = DateTime.UtcNow.ToString("o"),
                        Link = "/apps/inventario/insumos",
                        UseRouter = true,
                        Read = false,
                        CodeToCopy = insumo.CodigoFabrica
                    });
                }
                else if (stock <= umbral)
                {
                    notifications.Add(new NotificationDto
                    {
                        Id = $"low-stock-{insumo.Id}",
                        Icon = "heroicons_solid:exclamation-triangle",
                        Title = $"<span class=\"text-yellow-600 font-extrabold\">Alerta de Stock Bajo</span>",
                        Description = $"Quedan únicamente <strong>{stock} unidades</strong> del componente <strong>{insumo.CodigoFabrica}</strong>. (Umbral de seguridad: {umbral}).",
                        Time = DateTime.UtcNow.ToString("o"),
                        Link = "/apps/inventario/insumos",
                        UseRouter = true,
                        Read = false,
                        CodeToCopy = insumo.CodigoFabrica
                    });
                }
            }

            return Ok(notifications);
        }
    }
}
