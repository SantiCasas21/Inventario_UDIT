using Application.Services;
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
        public CategoriaInsumoController(CatalogoService<CategoriaInsumo> service) : base(service) { }
    }

    [Route("api/empaquetamiento")]
    public class EmpaquetamientoController : BaseCatalogoController<Empaquetamiento>
    {
        public EmpaquetamientoController(CatalogoService<Empaquetamiento> service) : base(service) { }
    }

    [Route("api/ubicacion")]
    public class UbicacionController : BaseCatalogoController<Ubicacion>
    {
        public UbicacionController(CatalogoService<Ubicacion> service) : base(service) { }
    }

    [Route("api/tipo-compra")]
    public class TipoCompraController : BaseCatalogoController<TipoCompra>
    {
        public TipoCompraController(CatalogoService<TipoCompra> service) : base(service) { }
    }

    [Route("api/estado-salida")]
    public class EstadoSalidaController : BaseCatalogoController<EstadoSalida>
    {
        public EstadoSalidaController(CatalogoService<EstadoSalida> service) : base(service) { }
    }

    [Route("api/estado-proyecto")]
    public class EstadoProyectoController : BaseCatalogoController<EstadoProyecto>
    {
        public EstadoProyectoController(CatalogoService<EstadoProyecto> service) : base(service) { }
    }

    [Route("api/proveedor")]
    public class ProveedorController : BaseCatalogoController<Proveedor>
    {
        public ProveedorController(CatalogoService<Proveedor> service) : base(service) { }
    }

    [Route("api/personal")]
    public class PersonalController : BaseCatalogoController<Personal>
    {
        public PersonalController(CatalogoService<Personal> service) : base(service) { }
    }
}
