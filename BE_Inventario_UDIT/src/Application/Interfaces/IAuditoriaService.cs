using Application.Common.Models;

namespace Application.Interfaces
{
    public interface IAuditoriaService
    {
        Task LogAsync(string accion, string modulo, string detalles, string? usuario = null);
        Task<PagedResult<DTOs.AuditoriaDto>> GetLogsAsync(int page = 1, int pageSize = 20, string textSearch = "", string modulo = "");
        Task SeedHistoricalDataAsync();
    }
}
