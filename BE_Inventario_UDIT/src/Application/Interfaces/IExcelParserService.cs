using Application.Common.Models;
using Application.DTOs;
using System.IO;
using System.Threading.Tasks;

namespace Application.Interfaces
{
    /// <summary>
    /// Servicio para parsear y validar archivos Excel/CSV de movimientos masivos.
    /// </summary>
    public interface IExcelParserService
    {
        Task<OperationResult<IngresoPreviewResponseDto>> ProcesarExcelIngresoAsync(Stream fileStream, string fileName);
    }
}
