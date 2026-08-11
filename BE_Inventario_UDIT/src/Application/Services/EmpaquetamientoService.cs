using Application.Common.Interfaces;
using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;
using Domain.Entities.Catalogos;

namespace Application.Services
{
    /// <summary>
    /// Servicio de Empaquetamiento con:
    ///  - CRUD con clasificación automática de familia (EmpaquetamientoClasificador)
    ///  - Filtrado por categoría (via la relación N:M CategoriaFamiliaEmpaquetamiento)
    ///  - Clasificación de pendientes (migración idempotente)
    /// </summary>
    public class EmpaquetamientoService : IEmpaquetamientoService
    {
        private readonly IBaseRepository<Empaquetamiento> _repository;
        private readonly IBaseRepository<FamiliaEmpaquetamiento> _familiaRepo;
        private readonly IBaseRepository<CategoriaFamiliaEmpaquetamiento> _categoriaFamiliaRepo;
        private readonly IAuditoriaService _auditoriaService;

        public EmpaquetamientoService(
            IBaseRepository<Empaquetamiento> repository,
            IBaseRepository<FamiliaEmpaquetamiento> familiaRepo,
            IBaseRepository<CategoriaFamiliaEmpaquetamiento> categoriaFamiliaRepo,
            IAuditoriaService auditoriaService)
        {
            _repository = repository;
            _familiaRepo = familiaRepo;
            _categoriaFamiliaRepo = categoriaFamiliaRepo;
            _auditoriaService = auditoriaService;
        }

        public async Task<OperationResult<IEnumerable<EmpaquetamientoDto>>> GetAllAsync()
        {
            var entities = await _repository.GetAllAsync("FamiliaEmpaquetamiento");
            var dtos = entities.Select(MapToDto).ToList();
            return OperationResult<IEnumerable<EmpaquetamientoDto>>.Ok(dtos);
        }

        public async Task<OperationResult<EmpaquetamientoDto>> GetByIdAsync(int id)
        {
            var entity = await _repository.GetByIdAsync(id, "FamiliaEmpaquetamiento");
            if (entity == null)
                return OperationResult<EmpaquetamientoDto>.Fail($"Empaquetamiento con ID {id} no encontrado");

            return OperationResult<EmpaquetamientoDto>.Ok(MapToDto(entity));
        }

        public async Task<OperationResult<EmpaquetamientoDto>> CreateAsync(EmpaquetamientoRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
                return OperationResult<EmpaquetamientoDto>.Fail("El nombre del empaquetamiento no puede estar vacío");

            // Validar duplicado (insensible a mayúsculas)
            var all = await _repository.GetAllAsync();
            if (all.Any(e => string.Equals(e.Tipo?.Trim(), request.Nombre.Trim(), StringComparison.OrdinalIgnoreCase)))
                return OperationResult<EmpaquetamientoDto>.Fail($"Ya existe un empaquetamiento con el nombre '{request.Nombre}'");

            var familiaId = await ResolverFamiliaAsync(request.Nombre, request.IdFamiliaEmpaquetamiento);
            if (familiaId == null)
                return OperationResult<EmpaquetamientoDto>.Fail("No se pudo determinar la familia del empaquetamiento");

            var entity = new Empaquetamiento
            {
                Tipo = request.Nombre.Trim(),
                IdFamiliaEmpaquetamiento = familiaId
            };

            var created = await _repository.AddAsync(entity);
            await _auditoriaService.LogAsync("CREAR", "Empaquetamiento", $"Se creó el empaquetamiento '{created.Tipo}' (ID {created.Id})");

            var dto = MapToDto(created);
            dto.FamiliaEmpaquetamientoNombre = await ObtenerNombreFamiliaAsync(familiaId.Value);
            return OperationResult<EmpaquetamientoDto>.Ok(dto, "Empaquetamiento creado exitosamente");
        }

        public async Task<OperationResult<EmpaquetamientoDto>> UpdateAsync(int id, EmpaquetamientoRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Nombre))
                return OperationResult<EmpaquetamientoDto>.Fail("El nombre del empaquetamiento no puede estar vacío");

            var all = await _repository.GetAllAsync();
            if (all.Any(e => e.Id != id && string.Equals(e.Tipo?.Trim(), request.Nombre.Trim(), StringComparison.OrdinalIgnoreCase)))
                return OperationResult<EmpaquetamientoDto>.Fail($"Ya existe un empaquetamiento con el nombre '{request.Nombre}'");

            var entity = await _repository.GetByIdAsync(id);
            if (entity == null)
                return OperationResult<EmpaquetamientoDto>.Fail($"Empaquetamiento con ID {id} no encontrado");

            var familiaId = await ResolverFamiliaAsync(request.Nombre, request.IdFamiliaEmpaquetamiento);
            if (familiaId == null)
                return OperationResult<EmpaquetamientoDto>.Fail("No se pudo determinar la familia del empaquetamiento");

            entity.Tipo = request.Nombre.Trim();
            entity.IdFamiliaEmpaquetamiento = familiaId;

            await _repository.UpdateAsync(entity);
            await _auditoriaService.LogAsync("EDITAR", "Empaquetamiento", $"Se editó el empaquetamiento '{entity.Tipo}' (ID {entity.Id})");

            var dto = MapToDto(entity);
            dto.FamiliaEmpaquetamientoNombre = await ObtenerNombreFamiliaAsync(familiaId.Value);
            return OperationResult<EmpaquetamientoDto>.Ok(dto, "Empaquetamiento actualizado exitosamente");
        }

        public async Task<OperationResult> DeleteAsync(int id)
        {
            try
            {
                if (!await _repository.ExistsAsync(id))
                    return OperationResult.Fail($"Empaquetamiento con ID {id} no encontrado");

                var entity = await _repository.GetByIdAsync(id);
                string nombre = entity?.Tipo ?? id.ToString();

                await _repository.DeleteAsync(id);
                await _auditoriaService.LogAsync("ELIMINAR", "Empaquetamiento", $"Se eliminó el empaquetamiento '{nombre}' (ID {id})");
                return OperationResult.Ok("Empaquetamiento eliminado exitosamente");
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException)
            {
                return OperationResult.Fail("No se puede eliminar este empaquetamiento porque está siendo utilizado en insumos.");
            }
            catch (Exception ex)
            {
                return OperationResult.Fail($"Ocurrió un error al eliminar: {ex.Message}");
            }
        }

        public async Task<OperationResult<IEnumerable<EmpaquetamientoDto>>> GetPorCategoriaAsync(int idCategoria)
        {
            // Familias vinculadas a la categoría
            var vinculos = await _categoriaFamiliaRepo.FindAsync(cf => cf.IdCategoria == idCategoria);
            var familiaIds = vinculos.Select(v => v.IdFamiliaEmpaquetamiento).Distinct().ToList();

            if (familiaIds.Count == 0)
                return OperationResult<IEnumerable<EmpaquetamientoDto>>.Ok(Array.Empty<EmpaquetamientoDto>());

            var empaquetamientos = await _repository.FindAsync(
                e => e.IdFamiliaEmpaquetamiento.HasValue && familiaIds.Contains(e.IdFamiliaEmpaquetamiento.Value),
                "FamiliaEmpaquetamiento");

            var dtos = empaquetamientos
                .OrderBy(e => e.Tipo)
                .Select(MapToDto)
                .ToList();

            return OperationResult<IEnumerable<EmpaquetamientoDto>>.Ok(dtos);
        }

        public async Task<OperationResult<IEnumerable<EmpaquetamientoDto>>> GetPorCategoriasAsync(int[] idsCategoria)
        {
            if (idsCategoria == null || idsCategoria.Length == 0)
                return OperationResult<IEnumerable<EmpaquetamientoDto>>.Ok(Array.Empty<EmpaquetamientoDto>());

            var vinculos = await _categoriaFamiliaRepo.FindAsync(cf => idsCategoria.Contains(cf.IdCategoria));
            var familiaIds = vinculos.Select(v => v.IdFamiliaEmpaquetamiento).Distinct().ToList();

            if (familiaIds.Count == 0)
                return OperationResult<IEnumerable<EmpaquetamientoDto>>.Ok(Array.Empty<EmpaquetamientoDto>());

            var empaquetamientos = await _repository.FindAsync(
                e => e.IdFamiliaEmpaquetamiento.HasValue && familiaIds.Contains(e.IdFamiliaEmpaquetamiento.Value),
                "FamiliaEmpaquetamiento");

            var dtos = empaquetamientos
                .OrderBy(e => e.Tipo)
                .Select(MapToDto)
                .ToList();

            return OperationResult<IEnumerable<EmpaquetamientoDto>>.Ok(dtos);
        }

        public async Task<int> ClasificarPendientesAsync()
        {
            var pendientes = await _repository.FindAsync(e => e.IdFamiliaEmpaquetamiento == null);
            if (!pendientes.Any())
                return 0;

            int clasificados = 0;
            foreach (var emp in pendientes)
            {
                var familiaId = await ResolverFamiliaAsync(emp.Tipo, null);
                if (familiaId.HasValue)
                {
                    emp.IdFamiliaEmpaquetamiento = familiaId.Value;
                    await _repository.UpdateAsync(emp);
                    clasificados++;
                }
            }

            if (clasificados > 0)
                await _auditoriaService.LogAsync("CLASIFICAR", "Empaquetamiento", $"Se clasificaron {clasificados} empaquetamientos pendientes");

            return clasificados;
        }

        // ==========================================
        // Helpers
        // ==========================================

        /// <summary>
        /// Resuelve el Id de la familia: usa la proporcionada por el usuario,
        /// o clasifica automáticamente por nombre si viene null.
        /// </summary>
        private async Task<int?> ResolverFamiliaAsync(string nombre, int? familiaPropuesta)
        {
            if (familiaPropuesta.HasValue && familiaPropuesta.Value > 0)
                return familiaPropuesta.Value;

            var familiaNombre = EmpaquetamientoClasificador.Clasificar(nombre);
            var familias = await _familiaRepo.FindAsync(f => f.Nombre == familiaNombre);
            return familias.FirstOrDefault()?.Id;
        }

        private async Task<string?> ObtenerNombreFamiliaAsync(int familiaId)
        {
            var familia = await _familiaRepo.GetByIdAsync(familiaId);
            return familia?.Nombre;
        }

        private static EmpaquetamientoDto MapToDto(Empaquetamiento e)
        {
            return new EmpaquetamientoDto
            {
                Id = e.Id,
                Nombre = e.Tipo,
                Tipo = "Empaquetamiento",
                IdFamiliaEmpaquetamiento = e.IdFamiliaEmpaquetamiento,
                FamiliaEmpaquetamientoNombre = e.FamiliaEmpaquetamiento?.Nombre
            };
        }
    }
}
