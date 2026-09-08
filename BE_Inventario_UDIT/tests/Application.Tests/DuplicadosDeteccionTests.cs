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
    public class DuplicadosDeteccionTests
    {
        private readonly Mock<IMovimientoRepository> _movRepoMock;
        private readonly Mock<IBaseRepository<Insumo>> _insumoRepoMock;
        private readonly Mock<IBaseRepository<Proyecto>> _proyectoRepoMock;
        private readonly Mock<IBaseRepository<Proveedor>> _proveedorRepoMock;
        private readonly ReporteService _service;

        public DuplicadosDeteccionTests()
        {
            _movRepoMock = new Mock<IMovimientoRepository>();
            _insumoRepoMock = new Mock<IBaseRepository<Insumo>>();
            _proyectoRepoMock = new Mock<IBaseRepository<Proyecto>>();
            _proveedorRepoMock = new Mock<IBaseRepository<Proveedor>>();

            _service = new ReporteService(
                _movRepoMock.Object,
                _insumoRepoMock.Object,
                _proyectoRepoMock.Object,
                _proveedorRepoMock.Object
            );
        }

        [Fact]
        public async Task GetDashboardAsync_DebeDetectarInsumosDuplicados_ConSeveridadAlta()
        {
            // Arrange
            var insumos = new List<Insumo>
            {
                new Insumo { Id = 101, CodigoFabrica = "NE555P", Descripcion = "Temporizador 555 DIP-8", PrecioReferencia = 500 },
                new Insumo { Id = 102, CodigoFabrica = "NE555P", Descripcion = "Timer 555", PrecioReferencia = 600 },
                new Insumo { Id = 103, CodigoFabrica = "LM358N", Descripcion = "Op-Amp dual", PrecioReferencia = 1200 }
            };

            _insumoRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(insumos);
            _proyectoRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<Proyecto>());
            _proveedorRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<Proveedor>());

            _movRepoMock.Setup(m => m.GetStockGeneralDbAsync())
                        .ReturnsAsync(new List<StockDbResult>
                        {
                            new StockDbResult { IdInsumo = 101, StockActual = 10 },
                            new StockDbResult { IdInsumo = 102, StockActual = 5 },
                            new StockDbResult { IdInsumo = 103, StockActual = 20 }
                        });

            _movRepoMock.Setup(m => m.GetStockPorUbicacionPorInsumosAsync(It.IsAny<int[]>()))
                        .ReturnsAsync(new Dictionary<int, List<StockUbicacionResult>>
                        {
                            { 101, new List<StockUbicacionResult> { new StockUbicacionResult { IdUbicacion = 1, UbicacionNombre = "A-01-02-11-004", Stock = 10 } } },
                            { 102, new List<StockUbicacionResult> { new StockUbicacionResult { IdUbicacion = 2, UbicacionNombre = "A-01-02-11-006", Stock = 5 } } }
                        });

            _movRepoMock.Setup(m => m.FilterPagedAsync(It.IsAny<MovimientoFilterDto>()))
                        .ReturnsAsync(new PagedResult<MovimientoInventario> { Items = new List<MovimientoInventario>(), TotalCount = 0 });

            _movRepoMock.Setup(m => m.FindAsync(It.IsAny<Expression<Func<MovimientoInventario, bool>>>()))
                        .ReturnsAsync(new List<MovimientoInventario>());

            // Act
            var result = await _service.GetDashboardAsync();

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);

            var irregularidadDuplicado = result.Data.Irregularidades.FirstOrDefault(i => i.Tipo == "duplicado");
            Assert.NotNull(irregularidadDuplicado);
            Assert.Equal("alta", irregularidadDuplicado.Severidad);
            Assert.Equal("NE555P", irregularidadDuplicado.InsumoRef);
            Assert.Contains("aparece 2 veces", irregularidadDuplicado.Descripcion);
            Assert.Equal(2, irregularidadDuplicado.Detalles.Count);
            Assert.Contains(irregularidadDuplicado.Detalles, d => d.Id == 101 && d.Ubicacion == "A-01-02-11-004");
            Assert.Contains(irregularidadDuplicado.Detalles, d => d.Id == 102 && d.Ubicacion == "A-01-02-11-006");
        }

        [Fact]
        public async Task GetDashboardAsync_DebeDetectarInsumosUnificados_ConSeveridadBajaYTipoResuelto()
        {
            // Arrange
            var insumos = new List<Insumo>
            {
                new Insumo { Id = 200, CodigoFabrica = "ATMEGA328P-PU", Descripcion = "Microcontrolador AVR DIP-28", PrecioReferencia = 15000 }
            };

            var movimientosUnificacion = new List<MovimientoInventario>
            {
                new MovimientoInventario
                {
                    Id = 1,
                    IdInsumo = 200,
                    TipoMovimiento = TipoMovimiento.Unificacion,
                    Cantidad = 0,
                    Fecha = DateTime.UtcNow
                }
            };

            _insumoRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(insumos);
            _proyectoRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<Proyecto>());
            _proveedorRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<Proveedor>());

            _movRepoMock.Setup(m => m.GetStockGeneralDbAsync())
                        .ReturnsAsync(new List<StockDbResult>
                        {
                            new StockDbResult { IdInsumo = 200, StockActual = 30 }
                        });

            _movRepoMock.Setup(m => m.GetStockPorUbicacionPorInsumosAsync(It.IsAny<int[]>()))
                        .ReturnsAsync(new Dictionary<int, List<StockUbicacionResult>>
                        {
                            {
                                200, new List<StockUbicacionResult>
                                {
                                    new StockUbicacionResult { IdUbicacion = 1, UbicacionNombre = "A-01-02", Stock = 20 },
                                    new StockUbicacionResult { IdUbicacion = 2, UbicacionNombre = "A-01-03", Stock = 10 }
                                }
                            }
                        });

            _movRepoMock.Setup(m => m.FilterPagedAsync(It.IsAny<MovimientoFilterDto>()))
                        .ReturnsAsync(new PagedResult<MovimientoInventario> { Items = new List<MovimientoInventario>(), TotalCount = 0 });

            // Setup find async para TipoMovimiento.Unificacion
            _movRepoMock.Setup(m => m.FindAsync(It.IsAny<Expression<Func<MovimientoInventario, bool>>>()))
                        .ReturnsAsync(movimientosUnificacion);

            // Act
            var result = await _service.GetDashboardAsync();

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);

            var irregularidadResuelta = result.Data.Irregularidades.FirstOrDefault(i => i.Tipo == "resuelto");
            Assert.NotNull(irregularidadResuelta);
            Assert.Equal("baja", irregularidadResuelta.Severidad);
            Assert.Equal("ATMEGA328P-PU", irregularidadResuelta.InsumoRef);
            Assert.Contains("fue unificado exitosamente", irregularidadResuelta.Descripcion);
            Assert.Equal(2, irregularidadResuelta.Detalles.Count);
            Assert.Contains(irregularidadResuelta.Detalles, d => d.Ubicacion == "A-01-02" && d.Stock == 20);
            Assert.Contains(irregularidadResuelta.Detalles, d => d.Ubicacion == "A-01-03" && d.Stock == 10);
        }
    }
}
