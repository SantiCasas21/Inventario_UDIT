using Application.Common.Interfaces;
using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;
using Application.Services;
using Domain.Entities;
using Domain.Enums;
using Moq;
using System.Threading.Tasks;
using Xunit;

namespace Application.Tests
{
    public class KardexServiceTests
    {
        private readonly Mock<IMovimientoRepository> _movRepoMock;
        private readonly Mock<IBaseRepository<Insumo>> _insumoRepoMock;
        private readonly KardexService _service;

        public KardexServiceTests()
        {
            _movRepoMock = new Mock<IMovimientoRepository>();
            _insumoRepoMock = new Mock<IBaseRepository<Insumo>>();
            _service = new KardexService(_movRepoMock.Object, _insumoRepoMock.Object);
        }

        [Fact]
        public async Task RegistrarIngresoAsync_ShouldSucceed_WhenInsumoExists()
        {
            // Arrange
            var insumoId = 1;
            var insumoObj = new Insumo { Id = insumoId, CodigoFabrica = "RES-100" };

            _insumoRepoMock.Setup(r => r.ExistsAsync(insumoId)).ReturnsAsync(true);
            _insumoRepoMock.Setup(r => r.GetByIdAsync(insumoId)).ReturnsAsync(insumoObj);

            _movRepoMock.Setup(r => r.AddAsync(It.IsAny<MovimientoInventario>()))
                        .ReturnsAsync((MovimientoInventario m) => { m.Id = 100; m.Insumo = insumoObj; return m; });

            var req = new MovimientoRequestDto
            {
                IdInsumo = insumoId,
                Cantidad = 5,
                PrecioUnitario = 1500,
                Observacion = "Ingreso de prueba"
            };

            // Act
            var result = await _service.RegistrarIngresoAsync(req);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.Equal("INGRESO", result.Data.TipoMovimiento);
            Assert.Equal(5, result.Data.Cantidad);
            _movRepoMock.Verify(r => r.AddAsync(It.Is<MovimientoInventario>(m => m.TipoMovimiento == TipoMovimiento.Ingreso)), Times.Once);
        }

        [Fact]
        public async Task RegistrarSalidaAsync_ShouldFail_WhenStockIsInsufficient()
        {
            // Arrange
            var insumoId = 1;
            _insumoRepoMock.Setup(r => r.ExistsAsync(insumoId)).ReturnsAsync(true);
            _movRepoMock.Setup(r => r.GetStockByInsumoAsync(insumoId)).ReturnsAsync(3); // Solo 3 unidades

            var req = new MovimientoRequestDto
            {
                IdInsumo = insumoId,
                Cantidad = 10, // Solicita 10
                IdProyecto = 1,
                IdEstadoSalida = 1
            };

            // Act
            var result = await _service.RegistrarSalidaAsync(req);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("Stock insuficiente", result.Message);
            _movRepoMock.Verify(r => r.AddAsync(It.IsAny<MovimientoInventario>()), Times.Never);
        }

        [Fact]
        public async Task RegistrarSalidaAsync_ShouldSucceed_WhenStockIsSufficient()
        {
            // Arrange
            var insumoId = 1;
            var insumoObj = new Insumo { Id = insumoId, CodigoFabrica = "RES-100" };

            _insumoRepoMock.Setup(r => r.ExistsAsync(insumoId)).ReturnsAsync(true);
            _insumoRepoMock.Setup(r => r.GetByIdAsync(insumoId)).ReturnsAsync(insumoObj);
            _movRepoMock.Setup(r => r.GetStockByInsumoAsync(insumoId)).ReturnsAsync(20);

            _movRepoMock.Setup(r => r.AddAsync(It.IsAny<MovimientoInventario>()))
                        .ReturnsAsync((MovimientoInventario m) => { m.Id = 101; m.Insumo = insumoObj; return m; });

            var req = new MovimientoRequestDto
            {
                IdInsumo = insumoId,
                Cantidad = 5,
                IdProyecto = 1,
                IdEstadoSalida = 1
            };

            // Act
            var result = await _service.RegistrarSalidaAsync(req);

            // Assert
            Assert.True(result.Success);
            Assert.Equal("SALIDA", result.Data!.TipoMovimiento);
            _movRepoMock.Verify(r => r.AddAsync(It.Is<MovimientoInventario>(m => m.TipoMovimiento == TipoMovimiento.Salida)), Times.Once);
        }
    }
}
