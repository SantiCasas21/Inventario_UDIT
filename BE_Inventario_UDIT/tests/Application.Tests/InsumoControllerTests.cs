using API.Controllers;
using Application.Common.Models;
using Application.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Threading.Tasks;
using Xunit;

namespace Application.Tests
{
    public class InsumoControllerTests
    {
        private readonly Mock<IInsumoService> _serviceMock;
        private readonly InsumoController _controller;

        public InsumoControllerTests()
        {
            _serviceMock = new Mock<IInsumoService>();
            _controller = new InsumoController(_serviceMock.Object);
        }

        [Fact]
        public async Task UnificarDuplicados_DebeRetornarBadRequest_CuandoRequestEsNull()
        {
            // Act
            var response = await _controller.UnificarDuplicados(null!);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(response);
            var result = Assert.IsAssignableFrom<OperationResult>(badRequestResult.Value);
            Assert.False(result.Success);
            Assert.Contains("Datos inválidos", result.Message);
        }

        [Theory]
        [InlineData("")]
        [InlineData("   ")]
        public async Task UnificarDuplicados_DebeRetornarBadRequest_CuandoCodigoFabricaEsVacio(string codigoVacio)
        {
            // Arrange
            var req = new InsumoController.UnificarRequest
            {
                CodigoFabrica = codigoVacio,
                IdInsumoPrincipal = 1
            };

            // Act
            var response = await _controller.UnificarDuplicados(req);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(response);
            var result = Assert.IsAssignableFrom<OperationResult>(badRequestResult.Value);
            Assert.False(result.Success);
            Assert.Contains("Datos inválidos", result.Message);
        }

        [Fact]
        public async Task UnificarDuplicados_DebeRetornarOk_CuandoServicioRetornaExito()
        {
            // Arrange
            var req = new InsumoController.UnificarRequest
            {
                CodigoFabrica = "NE555P",
                IdInsumoPrincipal = 10
            };

            _serviceMock.Setup(s => s.UnificarDuplicadosAsync("NE555P", 10))
                        .ReturnsAsync(OperationResult.Ok("Se unificaron 2 insumos correctamente."));

            // Act
            var response = await _controller.UnificarDuplicados(req);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(response);
            var result = Assert.IsAssignableFrom<OperationResult>(okResult.Value);
            Assert.True(result.Success);
            Assert.Contains("Se unificaron 2 insumos correctamente", result.Message);
            _serviceMock.Verify(s => s.UnificarDuplicadosAsync("NE555P", 10), Times.Once);
        }

        [Fact]
        public async Task UnificarDuplicados_DebeRetornarBadRequest_CuandoServicioRetornaFallo()
        {
            // Arrange
            var req = new InsumoController.UnificarRequest
            {
                CodigoFabrica = "RES-100",
                IdInsumoPrincipal = 5
            };

            _serviceMock.Setup(s => s.UnificarDuplicadosAsync("RES-100", 5))
                        .ReturnsAsync(OperationResult.Fail("No hay insumos duplicados para unificar."));

            // Act
            var response = await _controller.UnificarDuplicados(req);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(response);
            var result = Assert.IsAssignableFrom<OperationResult>(badRequestResult.Value);
            Assert.False(result.Success);
            Assert.Contains("No hay insumos duplicados para unificar", result.Message);
            _serviceMock.Verify(s => s.UnificarDuplicadosAsync("RES-100", 5), Times.Once);
        }
    }
}
