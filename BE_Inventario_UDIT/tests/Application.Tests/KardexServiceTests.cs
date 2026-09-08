using Application.Common.Interfaces;
using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;
using Application.Services;
using Domain.Entities;
using Domain.Enums;
using Moq;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

namespace Application.Tests
{
    public class KardexServiceTests
    {
        private readonly Mock<IMovimientoRepository> _movRepoMock;
        private readonly Mock<IBaseRepository<Insumo>> _insumoRepoMock;
        private readonly Mock<IAuditoriaService> _auditoriaServiceMock;
        private readonly KardexService _service;

        public KardexServiceTests()
        {
            _movRepoMock = new Mock<IMovimientoRepository>();
            _insumoRepoMock = new Mock<IBaseRepository<Insumo>>();
            _auditoriaServiceMock = new Mock<IAuditoriaService>();
            _service = new KardexService(_movRepoMock.Object, _insumoRepoMock.Object, _auditoriaServiceMock.Object);
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
                IdUbicacion = 1,
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
            _insumoRepoMock.Setup(r => r.GetByIdAsync(insumoId)).ReturnsAsync(new Insumo { Id = insumoId, CodigoFabrica = "RES-100" });
            _movRepoMock.Setup(r => r.GetStockPorUbicacionAsync(insumoId))
                        .ReturnsAsync(new List<StockUbicacionResult>
                        {
                            new StockUbicacionResult { IdUbicacion = 1, UbicacionNombre = "A-01", Stock = 3 }
                        });

            var req = new MovimientoRequestDto
            {
                IdInsumo = insumoId,
                Cantidad = 10, // Solicita 10 pero solo hay 3 en ubicación 1
                IdUbicacion = 1,
                IdProyecto = 1,
                IdEstadoSalida = 1
            };

            // Act
            var result = await _service.RegistrarSalidaAsync(req);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("Stock insuficiente en la ubicación seleccionada", result.Message);
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
            _movRepoMock.Setup(r => r.GetStockPorUbicacionAsync(insumoId))
                        .ReturnsAsync(new List<StockUbicacionResult>
                        {
                            new StockUbicacionResult { IdUbicacion = 1, UbicacionNombre = "A-01", Stock = 20 }
                        });

            _movRepoMock.Setup(r => r.AddAsync(It.IsAny<MovimientoInventario>()))
                        .ReturnsAsync((MovimientoInventario m) => { m.Id = 101; m.Insumo = insumoObj; return m; });

            var req = new MovimientoRequestDto
            {
                IdInsumo = insumoId,
                Cantidad = 5,
                IdUbicacion = 1,
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

        [Fact]
        public async Task RegistrarIngresoMasivoAsync_ShouldSucceed_AndCalculateTotalInversion()
        {
            // Arrange
            var insumo1 = new Insumo { Id = 1, CodigoFabrica = "RES-10K", PrecioReferencia = 100 };
            var insumo2 = new Insumo { Id = 2, CodigoFabrica = "CAP-100U", PrecioReferencia = 200 };

            _insumoRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(insumo1);
            _insumoRepoMock.Setup(r => r.GetByIdAsync(2)).ReturnsAsync(insumo2);

            _movRepoMock.Setup(r => r.AddAsync(It.IsAny<MovimientoInventario>()))
                        .ReturnsAsync((MovimientoInventario m) => { m.Id = 10; return m; });

            var request = new IngresoMasivoRequestDto
            {
                Movimientos = new List<MovimientoRequestDto>
                {
                    new MovimientoRequestDto { IdInsumo = 1, Cantidad = 10, PrecioUnitario = 150, IdUbicacion = 1 },
                    new MovimientoRequestDto { IdInsumo = 2, Cantidad = 5, PrecioUnitario = 300, IdUbicacion = 2 }
                }
            };

            // Act
            var result = await _service.RegistrarIngresoMasivoAsync(request, "tester@udit.edu.co");

            // Assert
            Assert.True(result.Success);
            Assert.Equal(2, result.Data!.TotalProcesados);
            Assert.Equal(3000m, result.Data!.TotalInvertido); // (10 * 150) + (5 * 300) = 1500 + 1500 = 3000
            Assert.Equal(150, insumo1.PrecioReferencia); // Se actualizó al último precio
            Assert.Equal(300, insumo2.PrecioReferencia);
            _movRepoMock.Verify(r => r.AddAsync(It.IsAny<MovimientoInventario>()), Times.Exactly(2));
        }

        [Fact]
        public async Task RegistrarSalidaAsync_ShouldFail_WhenProyectoIsNull()
        {
            // Arrange
            var insumoId = 1;
            var insumoObj = new Insumo { Id = insumoId, CodigoFabrica = "RES-100" };
            _insumoRepoMock.Setup(r => r.GetByIdAsync(insumoId)).ReturnsAsync(insumoObj);
            _movRepoMock.Setup(r => r.GetStockPorUbicacionAsync(insumoId))
                        .ReturnsAsync(new List<StockUbicacionResult>
                        {
                            new StockUbicacionResult { IdUbicacion = 1, UbicacionNombre = "A-01", Stock = 20 }
                        });

            var req = new MovimientoRequestDto
            {
                IdInsumo = insumoId,
                Cantidad = 5,
                IdUbicacion = 1,
                IdProyecto = null, // Proyecto requerido
                IdEstadoSalida = 1
            };

            // Act
            var result = await _service.RegistrarSalidaAsync(req);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("asociada a un proyecto", result.Message);
        }

        [Fact]
        public async Task RegistrarSalidaAsync_ShouldFail_WhenEstadoSalidaIsNull()
        {
            // Arrange
            var insumoId = 1;
            var insumoObj = new Insumo { Id = insumoId, CodigoFabrica = "RES-100" };
            _insumoRepoMock.Setup(r => r.GetByIdAsync(insumoId)).ReturnsAsync(insumoObj);
            _movRepoMock.Setup(r => r.GetStockPorUbicacionAsync(insumoId))
                        .ReturnsAsync(new List<StockUbicacionResult>
                        {
                            new StockUbicacionResult { IdUbicacion = 1, UbicacionNombre = "A-01", Stock = 20 }
                        });

            var req = new MovimientoRequestDto
            {
                IdInsumo = insumoId,
                Cantidad = 5,
                IdUbicacion = 1,
                IdProyecto = 1,
                IdEstadoSalida = null // Estado salida requerido
            };

            // Act
            var result = await _service.RegistrarSalidaAsync(req);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("estado asignado", result.Message);
        }

        [Fact]
        public async Task RegistrarSalidaAsync_ShouldUsePrecioReferencia_WhenPrecioUnitarioNotSpecified()
        {
            // Arrange
            var insumoId = 1;
            var insumoObj = new Insumo { Id = insumoId, CodigoFabrica = "RES-100", PrecioReferencia = 750m };
            _insumoRepoMock.Setup(r => r.GetByIdAsync(insumoId)).ReturnsAsync(insumoObj);
            _movRepoMock.Setup(r => r.GetStockPorUbicacionAsync(insumoId))
                        .ReturnsAsync(new List<StockUbicacionResult>
                        {
                            new StockUbicacionResult { IdUbicacion = 1, UbicacionNombre = "A-01", Stock = 20 }
                        });

            MovimientoInventario? guardado = null;
            _movRepoMock.Setup(r => r.AddAsync(It.IsAny<MovimientoInventario>()))
                        .Callback<MovimientoInventario>(m => guardado = m)
                        .ReturnsAsync((MovimientoInventario m) => { m.Id = 101; m.Insumo = insumoObj; return m; });

            var req = new MovimientoRequestDto
            {
                IdInsumo = insumoId,
                Cantidad = 2,
                IdUbicacion = 1,
                IdProyecto = 1,
                IdEstadoSalida = 1,
                PrecioUnitario = null // Debe tomar PrecioReferencia = 750
            };

            // Act
            var result = await _service.RegistrarSalidaAsync(req);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(guardado);
            Assert.Equal(750m, guardado!.PrecioUnitario);
        }

        [Fact]
        public async Task RegistrarIngresoAsync_ShouldUpdatePrecioReferencia_WhenPrecioUnitarioSpecified()
        {
            // Arrange
            var insumoId = 1;
            var insumoObj = new Insumo { Id = insumoId, CodigoFabrica = "RES-100", PrecioReferencia = 500m };
            _insumoRepoMock.Setup(r => r.GetByIdAsync(insumoId)).ReturnsAsync(insumoObj);
            _movRepoMock.Setup(r => r.AddAsync(It.IsAny<MovimientoInventario>()))
                        .ReturnsAsync((MovimientoInventario m) => { m.Id = 102; m.Insumo = insumoObj; return m; });

            var req = new MovimientoRequestDto
            {
                IdInsumo = insumoId,
                Cantidad = 10,
                PrecioUnitario = 950m, // Debe actualizar insumo.PrecioReferencia
                IdUbicacion = 1,
                Observacion = "Ingreso con nuevo precio"
            };

            // Act
            var result = await _service.RegistrarIngresoAsync(req);

            // Assert
            Assert.True(result.Success);
            Assert.Equal(950m, insumoObj.PrecioReferencia);
            _insumoRepoMock.Verify(r => r.UpdateAsync(insumoObj), Times.Once);
        }

        [Fact]
        public async Task RegistrarAjusteAsync_PositiveQuantity_ShouldSucceed()
        {
            // Arrange
            var insumoId = 1;
            var insumoObj = new Insumo { Id = insumoId, CodigoFabrica = "RES-100" };
            _insumoRepoMock.Setup(r => r.GetByIdAsync(insumoId)).ReturnsAsync(insumoObj);
            _movRepoMock.Setup(r => r.GetStockPorUbicacionAsync(insumoId))
                        .ReturnsAsync(new List<StockUbicacionResult>
                        {
                            new StockUbicacionResult { IdUbicacion = 1, UbicacionNombre = "A-01", Stock = 10 }
                        });

            _movRepoMock.Setup(r => r.AddAsync(It.IsAny<MovimientoInventario>()))
                        .ReturnsAsync((MovimientoInventario m) => { m.Id = 200; m.Insumo = insumoObj; return m; });

            var req = new MovimientoRequestDto
            {
                IdInsumo = insumoId,
                Cantidad = 5,
                IdUbicacion = 1,
                Observacion = "Ajuste por conteo físico"
            };

            // Act
            var result = await _service.RegistrarAjusteAsync(req);

            // Assert
            Assert.True(result.Success);
            Assert.Equal("AJUSTE", result.Data!.TipoMovimiento);
            _movRepoMock.Verify(r => r.AddAsync(It.Is<MovimientoInventario>(m => m.TipoMovimiento == TipoMovimiento.Ajuste && m.Cantidad == 5)), Times.Once);
        }

        [Fact]
        public async Task RegistrarAjusteAsync_NegativeQuantity_ShouldFail_WhenInsufficientStock()
        {
            // Arrange
            var insumoId = 1;
            var insumoObj = new Insumo { Id = insumoId, CodigoFabrica = "RES-100" };
            _insumoRepoMock.Setup(r => r.GetByIdAsync(insumoId)).ReturnsAsync(insumoObj);
            _movRepoMock.Setup(r => r.GetStockPorUbicacionAsync(insumoId))
                        .ReturnsAsync(new List<StockUbicacionResult>
                        {
                            new StockUbicacionResult { IdUbicacion = 1, UbicacionNombre = "A-01", Stock = 4 }
                        });

            var req = new MovimientoRequestDto
            {
                IdInsumo = insumoId,
                Cantidad = -10, // Requiere descontar 10 pero solo hay 4
                IdUbicacion = 1,
                Observacion = "Ajuste por merma"
            };

            // Act
            var result = await _service.RegistrarAjusteAsync(req);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("Stock insuficiente en la ubicación origen", result.Message);
            _movRepoMock.Verify(r => r.AddAsync(It.IsAny<MovimientoInventario>()), Times.Never);
        }

        [Fact]
        public async Task RegistrarAjusteAsync_WithNuevaUbicacion_ShouldCreateAjusteAndTraslado()
        {
            // Arrange
            var insumoId = 1;
            var insumoObj = new Insumo { Id = insumoId, CodigoFabrica = "RES-100" };
            _insumoRepoMock.Setup(r => r.GetByIdAsync(insumoId)).ReturnsAsync(insumoObj);
            _movRepoMock.Setup(r => r.GetStockPorUbicacionAsync(insumoId))
                        .ReturnsAsync(new List<StockUbicacionResult>
                        {
                            new StockUbicacionResult { IdUbicacion = 1, UbicacionNombre = "A-01", Stock = 10 }
                        });

            var movimientosCreados = new List<MovimientoInventario>();
            _movRepoMock.Setup(r => r.AddAsync(It.IsAny<MovimientoInventario>()))
                        .Callback<MovimientoInventario>(m => movimientosCreados.Add(m))
                        .ReturnsAsync((MovimientoInventario m) => { m.Id = movimientosCreados.Count; m.Insumo = insumoObj; return m; });

            var req = new MovimientoRequestDto
            {
                IdInsumo = insumoId,
                Cantidad = -2, // Ajusta -2 (quedan 8) y traslada los 8 restantes
                IdUbicacion = 1,
                IdNuevaUbicacion = 2,
                Observacion = "Reubicación a gaveta B-02"
            };

            // Act
            var result = await _service.RegistrarAjusteAsync(req);

            // Assert
            Assert.True(result.Success);
            Assert.Equal(2, movimientosCreados.Count);

            var ajuste = movimientosCreados[0];
            Assert.Equal(TipoMovimiento.Ajuste, ajuste.TipoMovimiento);
            Assert.Equal(-2, ajuste.Cantidad);
            Assert.Equal(1, ajuste.IdUbicacion);

            var traslado = movimientosCreados[1];
            Assert.Equal(TipoMovimiento.Traslado, traslado.TipoMovimiento);
            Assert.Equal(8, traslado.Cantidad); // 10 + (-2) = 8
            Assert.Equal(2, traslado.IdUbicacion);
            Assert.Equal(1, traslado.IdUbicacionAnterior);
        }

        [Fact]
        public async Task RegistrarAjusteAsync_ShouldFail_WhenQuantityZeroAndNoNuevaUbicacion()
        {
            // Arrange
            var insumoId = 1;
            var insumoObj = new Insumo { Id = insumoId, CodigoFabrica = "RES-100" };
            _insumoRepoMock.Setup(r => r.GetByIdAsync(insumoId)).ReturnsAsync(insumoObj);

            var req = new MovimientoRequestDto
            {
                IdInsumo = insumoId,
                Cantidad = 0,
                IdUbicacion = 1,
                IdNuevaUbicacion = null, // No es traslado ni ajuste de cantidad
                Observacion = "Ajuste vacío"
            };

            // Act
            var result = await _service.RegistrarAjusteAsync(req);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("La cantidad del ajuste no puede ser 0", result.Message);
        }

        [Fact]
        public async Task RegistrarAjusteAsync_ShouldFail_WhenObservacionIsEmpty()
        {
            // Arrange
            var insumoId = 1;
            var insumoObj = new Insumo { Id = insumoId, CodigoFabrica = "RES-100" };
            _insumoRepoMock.Setup(r => r.GetByIdAsync(insumoId)).ReturnsAsync(insumoObj);

            var req = new MovimientoRequestDto
            {
                IdInsumo = insumoId,
                Cantidad = 5,
                IdUbicacion = 1,
                Observacion = "" // Observación requerida
            };

            // Act
            var result = await _service.RegistrarAjusteAsync(req);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("requiere una observación", result.Message);
        }

        [Fact]
        public async Task RegistrarIngresoMasivoAsync_ShouldCollectErrors_WhenItemMissingUbicacionOrInsumoNotExist()
        {
            // Arrange
            var insumoValido = new Insumo { Id = 1, CodigoFabrica = "RES-1K", PrecioReferencia = 50 };
            _insumoRepoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(insumoValido);
            _insumoRepoMock.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Insumo?)null);

            _movRepoMock.Setup(r => r.AddAsync(It.IsAny<MovimientoInventario>()))
                        .ReturnsAsync((MovimientoInventario m) => { m.Id = 55; m.Insumo = insumoValido; return m; });

            var request = new IngresoMasivoRequestDto
            {
                Movimientos = new List<MovimientoRequestDto>
                {
                    new MovimientoRequestDto { IdInsumo = 99, Cantidad = 10, IdUbicacion = 1 }, // Insumo no existe
                    new MovimientoRequestDto { IdInsumo = 1, Cantidad = 5, IdUbicacion = null }, // Sin ubicación
                    new MovimientoRequestDto { IdInsumo = 1, Cantidad = 10, IdUbicacion = 1, PrecioUnitario = 60 } // Válido
                }
            };

            // Act
            var result = await _service.RegistrarIngresoMasivoAsync(request, "admin@udit.edu.co");

            // Assert
            Assert.True(result.Success);
            Assert.Equal(1, result.Data!.TotalProcesados);
            Assert.Equal(2, result.Data!.Errores.Count);
            Assert.Contains(result.Data.Errores, e => e.Contains("insumo con ID 99 no existe", StringComparison.OrdinalIgnoreCase));
            Assert.Contains(result.Data.Errores, e => e.Contains("especificar la ubicación", StringComparison.OrdinalIgnoreCase));
        }
    }
}
