using Application.Common.Interfaces;
using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;

namespace Application.Services
{
    /// <summary>
    /// Servicio genérico para catálogos.
    ///
    /// Recibe:
    ///   1. IBaseRepository<T> — CRUD contra BD
    ///   2. Func<T, CatalogoDto> — mapea entidad → DTO
    ///   3. Func<CatalogoRequestDto, T> — crea entidad desde request
    ///   4. Action<T, string> — setea la propiedad nombre en la entidad (sin reflexión)
    ///   5. string tipoNombre — nombre legible del catálogo
    ///
    /// UNA SOLA CLASE sirve para TODOS los catálogos.
    /// </summary>
    public class CatalogoService<T> : ICatalogoService<T> where T : class
    {
        private readonly IBaseRepository<T> _repository;
        private readonly Func<T, CatalogoDto> _toDto;
        private readonly Func<CatalogoRequestDto, T> _toEntity;
        private readonly Action<T, string> _setNombre;
        private readonly string _tipoNombre;
        private readonly IAuditoriaService _auditoriaService;

        public CatalogoService(
            IBaseRepository<T> repository,
            IAuditoriaService auditoriaService,
            Func<T, CatalogoDto> toDto,
            Func<CatalogoRequestDto, T> toEntity,
            Action<T, string> setNombre,
            string tipoNombre)
        {
            _repository = repository;
            _toDto = toDto;
            _toEntity = toEntity;
            _setNombre = setNombre;
            _tipoNombre = tipoNombre;
            _auditoriaService = auditoriaService;
        }

        public async Task<OperationResult<IEnumerable<CatalogoDto>>> GetAllAsync()
        {
            var entities = await _repository.GetAllAsync();
            var dtos = entities.Select(e =>
            {
                var dto = _toDto(e);
                dto.Tipo = _tipoNombre;
                return dto;
            });

            return OperationResult<IEnumerable<CatalogoDto>>.Ok(dtos);
        }

        public async Task<OperationResult<CatalogoDto>> GetByIdAsync(int id)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<CatalogoDto>.Fail(
                    $"{_tipoNombre} con ID {id} no encontrado");

            var dto = _toDto(entity);
            dto.Tipo = _tipoNombre;
            return OperationResult<CatalogoDto>.Ok(dto);
        }

        public async Task<OperationResult<CatalogoDto>> CreateAsync(CatalogoRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
                return OperationResult<CatalogoDto>.Fail("El nombre no puede estar vacío");

            var allEntities = await _repository.GetAllAsync();
            var allDtos = allEntities.Select(_toDto);
            if (allDtos.Any(d => string.Equals(d.Nombre?.Trim(), request.Nombre?.Trim(), StringComparison.OrdinalIgnoreCase)))
            {
                return OperationResult<CatalogoDto>.Fail($"Ya existe un registro en {_tipoNombre} con el nombre '{request.Nombre}'");
            }

            var entity = _toEntity(request);
            var created = await _repository.AddAsync(entity);

            var dto = _toDto(created);
            dto.Tipo = _tipoNombre;
            
            await _auditoriaService.LogAsync("CREAR", _tipoNombre, $"Se creó el elemento '{request.Nombre}' con ID {dto.Id}");
            
            return OperationResult<CatalogoDto>.Ok(dto, $"{_tipoNombre} creado exitosamente");
        }

        public async Task<OperationResult<CatalogoDto>> UpdateAsync(int id, CatalogoRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
                return OperationResult<CatalogoDto>.Fail("El nombre no puede estar vacío");

            var allEntities = await _repository.GetAllAsync();
            var allDtos = allEntities.Select(_toDto);
            if (allDtos.Any(d => d.Id != id && string.Equals(d.Nombre?.Trim(), request.Nombre?.Trim(), StringComparison.OrdinalIgnoreCase)))
            {
                return OperationResult<CatalogoDto>.Fail($"Ya existe un registro en {_tipoNombre} con el nombre '{request.Nombre}'");
            }

            var entity = await _repository.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<CatalogoDto>.Fail(
                    $"{_tipoNombre} con ID {id} no encontrado");

            // Usar el delegado en vez de reflexión
            _setNombre(entity, request.Nombre);

            await _repository.UpdateAsync(entity);

            var dto = _toDto(entity);
            dto.Tipo = _tipoNombre;
            
            await _auditoriaService.LogAsync("EDITAR", _tipoNombre, $"Se editó el elemento '{request.Nombre}' con ID {dto.Id}");
            
            return OperationResult<CatalogoDto>.Ok(dto, $"{_tipoNombre} actualizado exitosamente");
        }

        public async Task<OperationResult> DeleteAsync(int id)
        {
            try
            {
                if (!await _repository.ExistsAsync(id))
                    return OperationResult.Fail($"{_tipoNombre} con ID {id} no encontrado");

                var entity = await _repository.GetByIdAsync(id);
                string nombreElemento = entity != null ? _toDto(entity).Nombre : id.ToString();
                
                await _repository.DeleteAsync(id);
                
                await _auditoriaService.LogAsync("ELIMINAR", _tipoNombre, $"Se eliminó el elemento '{nombreElemento}' con ID {id}");
                
                return OperationResult.Ok($"{_tipoNombre} eliminado exitosamente");
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException)
            {
                return OperationResult.Fail("No se puede eliminar este registro porque está siendo utilizado en insumos o movimientos del sistema.");
            }
            catch (Exception ex)
            {
                return OperationResult.Fail($"Ocurrió un error al eliminar: {ex.Message}");
            }
        }
    }
}
