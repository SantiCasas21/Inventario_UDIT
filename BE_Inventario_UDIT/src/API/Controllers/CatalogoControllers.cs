using Application.DTOs;
using Application.Interfaces;
using Domain.Entities.Catalogos;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    /// <summary>
    /// Los 8 controllers de catálogo.
    /// Cada uno ES UNA SOLA CLASE que hereda del base genérico.
    /// No hay código duplicado — solo la ruta y la inyección del servicio.
    /// </summary>

    [Route("api/categoria-insumo")]
    public class CategoriaInsumoController : BaseCatalogoController<CategoriaInsumo>
    {
        public CategoriaInsumoController(ICatalogoService<CategoriaInsumo> service) : base(service) { }
    }

    // NOTA: Empaquetamiento usa un controller dedicado (EmpaquetamientoController)
    // con clasificación inteligente y filtrado por categoría.

    [Route("api/familia-empaquetamiento")]
    public class FamiliaEmpaquetamientoController : BaseCatalogoController<FamiliaEmpaquetamiento>
    {
        public FamiliaEmpaquetamientoController(ICatalogoService<FamiliaEmpaquetamiento> service) : base(service) { }
    }

    [Route("api/ubicacion")]
    public class UbicacionController : BaseCatalogoController<Ubicacion>
    {
        private readonly IMovimientoRepository _movimientoRepo;

        public UbicacionController(
            ICatalogoService<Ubicacion> service,
            IMovimientoRepository movimientoRepo) : base(service)
        {
            _movimientoRepo = movimientoRepo;
        }

        // POST /api/ubicacion/activas-por-filtro
        [HttpPost("activas-por-filtro")]
        public async Task<IActionResult> GetActivasPorFiltroPost([FromBody] InsumoFilterDto filter)
        {
            var result = await _movimientoRepo.GetUbicacionesConStockPorFiltroAsync(filter);
            return Ok(Application.Common.Models.OperationResult<List<CatalogoDto>>.Ok(result));
        }

        // GET /api/ubicacion/activas-por-filtro
        [HttpGet("activas-por-filtro")]
        public async Task<IActionResult> GetActivasPorFiltroGet([FromQuery] InsumoFilterDto filter)
        {
            var result = await _movimientoRepo.GetUbicacionesConStockPorFiltroAsync(filter);
            return Ok(Application.Common.Models.OperationResult<List<CatalogoDto>>.Ok(result));
        }
    }

    [Route("api/tipo-compra")]
    public class TipoCompraController : BaseCatalogoController<TipoCompra>
    {
        public TipoCompraController(ICatalogoService<TipoCompra> service) : base(service) { }
    }

    [Route("api/estado-salida")]
    public class EstadoSalidaController : BaseCatalogoController<EstadoSalida>
    {
        public EstadoSalidaController(ICatalogoService<EstadoSalida> service) : base(service) { }
    }

    [Route("api/estado-proyecto")]
    public class EstadoProyectoController : BaseCatalogoController<EstadoProyecto>
    {
        public EstadoProyectoController(ICatalogoService<EstadoProyecto> service) : base(service) { }
    }

    [Route("api/proveedor")]
    public class ProveedorController : BaseCatalogoController<Proveedor>
    {
        public ProveedorController(ICatalogoService<Proveedor> service) : base(service) { }
    }

    [Route("api/personal")]
    public class PersonalController : BaseCatalogoController<Personal>
    {
        public PersonalController(ICatalogoService<Personal> service) : base(service) { }
    }
}
