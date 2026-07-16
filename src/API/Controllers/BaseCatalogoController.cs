using Application.DTOs;
using Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    /// <summary>
    /// Controller base genérico para catálogos.
    /// T puede ser CategoriaInsumo, Empaquetamiento, Ubicacion...
    ///
    /// Un solo controller que expone 5 endpoints REST y sirve
    /// para los 8 catálogos del sistema.
    /// </summary>
    [ApiController]
    public abstract class BaseCatalogoController<T> : ControllerBase where T : class
    {
        private readonly CatalogoService<T> _service;

        protected BaseCatalogoController(CatalogoService<T> service)
        {
            _service = service;
        }

        // GET /api/{tipo}
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _service.GetAllAsync();
            return Ok(result);
        }

        // GET /api/{tipo}/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _service.GetByIdAsync(id);
            if (!result.Success)
                return NotFound(result);

            return Ok(result);
        }

        // POST /api/{tipo}
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CatalogoRequestDto request)
        {
            var result = await _service.CreateAsync(request);
            if (!result.Success)
                return BadRequest(result);

            return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result);
        }

        // PUT /api/{tipo}/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CatalogoRequestDto request)
        {
            var result = await _service.UpdateAsync(id, request);
            if (!result.Success)
                return NotFound(result);

            return Ok(result);
        }

        // DELETE /api/{tipo}/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _service.DeleteAsync(id);
            if (!result.Success)
                return NotFound(result);

            return Ok(result);
        }
    }
}
