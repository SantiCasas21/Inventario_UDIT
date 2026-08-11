using Application.DTOs;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers
{
    [ApiController]
    [Authorize]
    public abstract class BaseCatalogoController<T> : ControllerBase where T : class
    {
        private readonly ICatalogoService<T> _service;

        protected BaseCatalogoController(ICatalogoService<T> service)
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
        [Authorize(Roles = "Admin,Developer")]
        public async Task<IActionResult> Create([FromBody] CatalogoRequestDto request)
        {
            if (request == null)
                return new ContentResult { StatusCode = 400, Content = "{\"message\":\"" + "El cuerpo de la solicitud no puede estar vacío" + "\"}", ContentType = "application/json" };

            var result = await _service.CreateAsync(request);
            if (!result.Success)
                return new ContentResult { StatusCode = 400, Content = "{\"message\":\"" + result.Message + "\"}", ContentType = "application/json" };

            return CreatedAtAction(nameof(GetById), new { id = result.Data?.Id }, result);
        }

        // PUT /api/{tipo}/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Developer")]
        public async Task<IActionResult> Update(int id, [FromBody] CatalogoRequestDto request)
        {
            if (request == null)
                return new ContentResult { StatusCode = 400, Content = "{\"message\":\"" + "El cuerpo de la solicitud no puede estar vacío" + "\"}", ContentType = "application/json" };

            var result = await _service.UpdateAsync(id, request);
            if (!result.Success)
            {
                if (result.Message.Contains("no encontrado"))
                    return NotFound(result);
                return new ContentResult { StatusCode = 400, Content = "{\"message\":\"" + result.Message + "\"}", ContentType = "application/json" };
            }

            return Ok(result);
        }

        // DELETE /api/{tipo}/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _service.DeleteAsync(id);
            if (!result.Success)
                return new ContentResult { StatusCode = 400, Content = "{\"message\":\"" + result.Message + "\"}", ContentType = "application/json" };

            return Ok(result);
        }
    }
}
