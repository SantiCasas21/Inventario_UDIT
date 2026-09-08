using Application.Common.Interfaces;
using Application.Common.Models;
using Application.DTOs;
using Application.Interfaces;
using Application.Services;
using Domain.Entities;
using Domain.Entities.Catalogos;
using Domain.Enums;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Xunit;

namespace Application.Tests
{
    public class ReporteServiceTests
    {
        private readonly Mock<IMovimientoRepository> _movRepoMock;
        private readonly Mock<IBaseRepository<Insumo>> _insumoRepoMock;
        private readonly Mock<IBaseRepository<Proyecto>> _proyectoRepoMock;
        private readonly Mock<IBaseRepository<Proveedor>> _proveedorRepoMock;
        private readonly ReporteService _service;

        public ReporteServiceTests()
        {
            _movRepoMock = new Mock<IMovimientoRepository>();
            _insumoRepoMock = new Mock<IBaseRepository<Insumo>>();
            _proyectoRepoMock = new Mock<IBaseRepository<Proyecto>>();
            _proveedorRepoMock = new Mock<IBaseRepository<Proveedor>>();

            _service = new ReporteService(
                _movRepoMock.Object,
                _insumoRepoMock.Object,
                _proyectoRepoMock.Object,
                _proveedorRepoMock.Object);
        }

        [Fact]
        public async Task GetKardexDetalladoAsync_ShouldCalculateAccumulatedBalance_Correctly()
        {
            // Arrange
            var insumoId = 1;
            var insumo = new Insumo { Id = insumoId, CodigoFabrica = "RES-10K" };
            _insumoRepoMock.Setup(r => r.GetByIdAsync(insumoId)).ReturnsAsync(insumo);

            var ubi1 = new Ubicacion { Id = 1, Nombre = "A-01-01" };
            var ubi2 = new Ubicacion { Id = 2, Nombre = "A-01-02" };

            var movimientos = new List<MovimientoInventario>
            {
                new MovimientoInventario { Id = 1, IdInsumo = insumoId, TipoMovimiento = TipoMovimiento.Ingreso, Cantidad = 100, Fecha = DateTime.UtcNow.AddDays(-5), Ubicacion = ubi1 },
                new MovimientoInventario { Id = 2, IdInsumo = insumoId, TipoMovimiento = TipoMovimiento.Salida, Cantidad = 30, Fecha = DateTime.UtcNow.AddDays(-4), Ubicacion = ubi1 },
                new MovimientoInventario { Id = 3, IdInsumo = insumoId, TipoMovimiento = TipoMovimiento.Traslado, Cantidad = 70, Fecha = DateTime.UtcNow.AddDays(-3), Ubicacion = ubi2, UbicacionAnterior = ubi1 },
                new MovimientoInventario { Id = 4, IdInsumo = insumoId, TipoMovimiento = TipoMovimiento.Ajuste, Cantidad = -10, Fecha = DateTime.UtcNow.AddDays(-2), Ubicacion = ubi2 },
                new MovimientoInventario { Id = 5, IdInsumo = insumoId, TipoMovimiento = TipoMovimiento.Ingreso, Cantidad = 20, Fecha = DateTime.UtcNow.AddDays(-1), Ubicacion = ubi2 }
            };

            _movRepoMock.Setup(m => m.FindAsync(
                It.IsAny<Expression<Func<MovimientoInventario, bool>>>(),
                It.IsAny<string[]>()))
                .ReturnsAsync(movimientos);

            _movRepoMock.Setup(m => m.GetStockPorUbicacionPorInsumosAsync(It.IsAny<int[]>()))
                        .ReturnsAsync(new Dictionary<int, List<StockUbicacionResult>>());

            // Act
            var result = await _service.GetKardexDetalladoAsync(insumoId);

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.Equal(5, result.Data.Count);

            // Balances:
            // Mov 1: +100 -> 100
            Assert.Equal(100, result.Data[0].SaldoAcumulado);
            // Mov 2: -30 -> 70
            Assert.Equal(70, result.Data[1].SaldoAcumulado);
            // Mov 3: Traslado (no altera stock) -> 70
            Assert.Equal(70, result.Data[2].SaldoAcumulado);
            Assert.Equal("TRASLADO", result.Data[2].TipoMovimiento);
            // Mov 4: Ajuste -10 -> 60
            Assert.Equal(60, result.Data[3].SaldoAcumulado);
            // Mov 5: +20 -> 80
            Assert.Equal(80, result.Data[4].SaldoAcumulado);
        }

        [Fact]
        public async Task GetKardexDetalladoAsync_ShouldUseFallbackLocation_WhenMovementLocationIsNull()
        {
            // Arrange
            var insumoId = 5;
            var insumo = new Insumo { Id = insumoId, CodigoFabrica = "CAP-10UF" };
            _insumoRepoMock.Setup(r => r.GetByIdAsync(insumoId)).ReturnsAsync(insumo);

            var movimientos = new List<MovimientoInventario>
            {
                new MovimientoInventario { Id = 10, IdInsumo = insumoId, TipoMovimiento = TipoMovimiento.Ingreso, Cantidad = 50, Fecha = DateTime.UtcNow, Ubicacion = null }
            };

            _movRepoMock.Setup(m => m.FindAsync(
                It.IsAny<Expression<Func<MovimientoInventario, bool>>>(),
                It.IsAny<string[]>()))
                .ReturnsAsync(movimientos);

            _movRepoMock.Setup(m => m.GetStockPorUbicacionPorInsumosAsync(new[] { insumoId }))
                        .ReturnsAsync(new Dictionary<int, List<StockUbicacionResult>>
                        {
                            { insumoId, new List<StockUbicacionResult> { new StockUbicacionResult { IdUbicacion = 3, UbicacionNombre = "B-02-05", Stock = 50 } } }
                        });

            // Act
            var result = await _service.GetKardexDetalladoAsync(insumoId);

            // Assert
            Assert.True(result.Success);
            Assert.Single(result.Data!);
            Assert.Equal("B-02-05", result.Data![0].Ubicacion);
        }

        [Fact]
        public async Task GetStockCriticoAsync_ShouldFilterBelowThreshold_AndShowLocationBreakdown()
        {
            // Arrange
            var insumos = new List<Insumo>
            {
                new Insumo { Id = 1, CodigoFabrica = "IC-1", Descripcion = "Micro", Categoria = new CategoriaInsumo { Nombre = "ICs" } },
                new Insumo { Id = 2, CodigoFabrica = "IC-2", Descripcion = "OpAmp", Categoria = new CategoriaInsumo { Nombre = "ICs" } },
                new Insumo { Id = 3, CodigoFabrica = "IC-3", Descripcion = "Timer", Categoria = new CategoriaInsumo { Nombre = "ICs" } }
            };

            _insumoRepoMock.Setup(r => r.GetAllAsync("Categoria")).ReturnsAsync(insumos);

            _movRepoMock.Setup(m => m.GetStockGeneralDbAsync())
                        .ReturnsAsync(new List<StockDbResult>
                        {
                            new StockDbResult { IdInsumo = 1, StockActual = 4 },   // Crítico (< 10)
                            new StockDbResult { IdInsumo = 2, StockActual = 0 },   // Crítico agotado
                            new StockDbResult { IdInsumo = 3, StockActual = 50 }   // No crítico
                        });

            _movRepoMock.Setup(m => m.GetStockPorUbicacionPorInsumosAsync(It.IsAny<int[]>()))
                        .ReturnsAsync(new Dictionary<int, List<StockUbicacionResult>>
                        {
                            {
                                1, new List<StockUbicacionResult>
                                {
                                    new StockUbicacionResult { UbicacionNombre = "A-01", Stock = 2 },
                                    new StockUbicacionResult { UbicacionNombre = "A-02", Stock = 2 }
                                }
                            }
                        });

            // Act
            var result = await _service.GetStockCriticoAsync(umbral: 10);

            // Assert
            Assert.True(result.Success);
            Assert.Equal(2, result.Data!.Count);

            var item1 = result.Data.First(c => c.IdInsumo == 1);
            Assert.Equal(4, item1.StockActual);
            Assert.Equal("A-01 (2), A-02 (2)", item1.Ubicacion);

            var item2 = result.Data.First(c => c.IdInsumo == 2);
            Assert.Equal(0, item2.StockActual);
            Assert.Equal("Agotado (Sin ubicación)", item2.Ubicacion);
        }

        [Fact]
        public async Task GetResumenPorProyectoAsync_ShouldCalculateCostsAndFixedStatus_Correctly()
        {
            // Arrange
            var estadoFinalizado = new EstadoProyecto { Id = 1, Estado = "Finalizado" };
            var proyecto = new Proyecto { Id = 10, Nombre = "Robot Seguidor", Estado = estadoFinalizado };

            var insumo1 = new Insumo { Id = 101, CodigoFabrica = "MOTOR-DC", Descripcion = "Motor 12V", PrecioReferencia = 15000m };
            var insumo2 = new Insumo { Id = 102, CodigoFabrica = "RUEDA-65", Descripcion = "Rueda goma", PrecioReferencia = 5000m };

            var movimientos = new List<MovimientoInventario>
            {
                // Insumo 1: 2 unidades con precio unitario 16000
                new MovimientoInventario { Id = 1, IdProyecto = 10, Proyecto = proyecto, IdInsumo = 101, Insumo = insumo1, Cantidad = 2, PrecioUnitario = 16000m, TipoMovimiento = TipoMovimiento.Salida },
                // Insumo 1: 1 unidad sin precio unitario (fallback a PrecioReferencia = 15000)
                new MovimientoInventario { Id = 2, IdProyecto = 10, Proyecto = proyecto, IdInsumo = 101, Insumo = insumo1, Cantidad = 1, PrecioUnitario = null, TipoMovimiento = TipoMovimiento.Salida },
                // Insumo 2: 4 unidades con precio 5000
                new MovimientoInventario { Id = 3, IdProyecto = 10, Proyecto = proyecto, IdInsumo = 102, Insumo = insumo2, Cantidad = 4, PrecioUnitario = 5000m, TipoMovimiento = TipoMovimiento.Salida }
            };

            _movRepoMock.Setup(m => m.FindAsync(
                It.IsAny<Expression<Func<MovimientoInventario, bool>>>(),
                "Insumo", "Proyecto", "Proyecto.Estado"))
                .ReturnsAsync(movimientos);

            // Act
            var result = await _service.GetResumenPorProyectoAsync(10);

            // Assert
            Assert.True(result.Success);
            Assert.Single(result.Data!);

            var resumen = result.Data![0];
            Assert.Equal(10, resumen.IdProyecto);
            Assert.Equal("Finalizado", resumen.EstadoNombre);
            Assert.True(resumen.EsCostoFijo); // Contiene "Finaliz" -> es costo fijo
            Assert.Equal(3, resumen.TotalMovimientos);
            Assert.Equal(7, resumen.TotalUnidadesRetiradas); // 2 + 1 + 4 = 7

            // Costo esperado:
            // Insumo 1: (2 * 16000) + (1 * 15000) = 32000 + 15000 = 47000
            // Insumo 2: 4 * 5000 = 20000
            // Total Proyecto: 47000 + 20000 = 67000
            Assert.Equal(67000m, resumen.CostoTotalProyecto);
            Assert.Equal(2, resumen.Insumos.Count);

            var itemInsumo1 = resumen.Insumos.First(i => i.IdInsumo == 101);
            Assert.Equal(3, itemInsumo1.CantidadRetirada);
            Assert.Equal(47000m, itemInsumo1.CostoTotal);
            Assert.Equal(15666.67m, itemInsumo1.PrecioUnitarioPromedio);
        }
    }
}
