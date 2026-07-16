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

        public CatalogoService(
            IBaseRepository<T> repository,
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

            var entity = _toEntity(request);
            var created = await _repository.AddAsync(entity);

            var dto = _toDto(created);
            dto.Tipo = _tipoNombre;
            return OperationResult<CatalogoDto>.Ok(dto, $"{_tipoNombre} creado exitosamente");
        }

        public async Task<OperationResult<CatalogoDto>> UpdateAsync(int id, CatalogoRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
                return OperationResult<CatalogoDto>.Fail("El nombre no puede estar vacío");

            var entity = await _repository.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<CatalogoDto>.Fail(
                    $"{_tipoNombre} con ID {id} no encontrado");

            // Usar el delegado en vez de reflexión
            _setNombre(entity, request.Nombre);

            await _repository.UpdateAsync(entity);

            var dto = _toDto(entity);
            dto.Tipo = _tipoNombre;
            return OperationResult<CatalogoDto>.Ok(dto, $"{_tipoNombre} actualizado exitosamente");
        }

        public async Task<OperationResult> DeleteAsync(int id)
        {
            if (!await _repository.ExistsAsync(id))
                return OperationResult.Fail(
                    $"{_tipoNombre} con ID {id} no encontrado");

            await _repository.DeleteAsync(id);
            return OperationResult.Ok($"{_tipoNombre} eliminado exitosamente");
        }
    }
}
