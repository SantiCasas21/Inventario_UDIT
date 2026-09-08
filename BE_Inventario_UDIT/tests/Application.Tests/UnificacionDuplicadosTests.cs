using Application.Common.Interfaces;
using Application.Common.Models;
using Application.Interfaces;
using Application.Services;
using Domain.Entities;
using Domain.Entities.Catalogos;
using Domain.Enums;
using Microsoft.AspNetCore.Http;
using Moq;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Security.Claims;
using System.Threading.Tasks;
using Xunit;

namespace Application.Tests
{
    public class UnificacionDuplicadosTests
    {
        private readonly Mock<IInsumoRepository> _insumoRepoMock;
        private readonly Mock<IMovimientoRepository> _movRepoMock;
        private readonly Mock<IBaseRepository<Ubicacion>> _ubicacionRepoMock;
        private readonly Mock<IAuditoriaService> _auditoriaServiceMock;
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly InsumoService _service;

        public UnificacionDuplicadosTests()
        {
            _insumoRepoMock = new Mock<IInsumoRepository>();
            _movRepoMock = new Mock<IMovimientoRepository>();
            _ubicacionRepoMock = new Mock<IBaseRepository<Ubicacion>>();
            _auditoriaServiceMock = new Mock<IAuditoriaService>();
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();

            var claimsPrincipal = new ClaimsPrincipal(new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Name, "AdminUser"),
                new Claim(ClaimTypes.Role, "Admin")
            }, "TestAuth"));

            var httpContext = new DefaultHttpContext { User = claimsPrincipal };
            _httpContextAccessorMock.Setup(h => h.HttpContext).Returns(httpContext);

            _service = new InsumoService(
                _insumoRepoMock.Object,
                _movRepoMock.Object,
                _ubicacionRepoMock.Object,
                _auditoriaServiceMock.Object,
                _httpContextAccessorMock.Object
            );
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        [InlineData("   ")]
        [InlineData("N/A")]
        [InlineData("n/a")]
        [InlineData(" N/A ")]
        public async Task UnificarDuplicadosAsync_DebeFallar_CuandoCodigoEsVacioONa(string? codigoInvalido)
        {
            // Act
            var result = await _service.UnificarDuplicadosAsync(codigoInvalido!, 1);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("No se puede unificar insumos con código 'N/A' o vacío", result.Message);
            _movRepoMock.Verify(m => m.MigrateMovimientosAsync(It.IsAny<int[]>(), It.IsAny<int>()), Times.Never);
        }

        [Fact]
        public async Task UnificarDuplicadosAsync_DebeFallar_CuandoNoHayDuplicados()
        {
            // Arrange
            var codigo = "RES-10K";
            _insumoRepoMock.Setup(r => r.FindAsync(It.IsAny<Expression<Func<Insumo, bool>>>()))
                           .ReturnsAsync(new List<Insumo>
                           {
                               new Insumo { Id = 1, CodigoFabrica = codigo }
                           });

            // Act
            var result = await _service.UnificarDuplicadosAsync(codigo, 1);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("No hay insumos duplicados para unificar", result.Message);
            _movRepoMock.Verify(m => m.MigrateMovimientosAsync(It.IsAny<int[]>(), It.IsAny<int>()), Times.Never);
        }

        [Fact]
        public async Task UnificarDuplicadosAsync_DebeFallar_CuandoInsumoPrincipalNoExisteEnDuplicados()
        {
            // Arrange
            var codigo = "CAP-100UF";
            _insumoRepoMock.Setup(r => r.FindAsync(It.IsAny<Expression<Func<Insumo, bool>>>()))
                           .ReturnsAsync(new List<Insumo>
                           {
                               new Insumo { Id = 10, CodigoFabrica = codigo },
                               new Insumo { Id = 20, CodigoFabrica = codigo }
                           });

            // Act: Insumo principal 999 no existe entre los encontrados
            var result = await _service.UnificarDuplicadosAsync(codigo, 999);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("El insumo principal seleccionado no existe", result.Message);
            _movRepoMock.Verify(m => m.MigrateMovimientosAsync(It.IsAny<int[]>(), It.IsAny<int>()), Times.Never);
        }

        [Fact]
        public async Task UnificarDuplicadosAsync_DebeCompletarUnificacion_MigrarKardex_YEliminarDuplicados()
        {
            // Arrange
            var codigo = "STM32F103C8T6";
            var insumoPrincipal = new Insumo { Id = 10, CodigoFabrica = codigo, Descripcion = "Microcontrolador ARM Cortex-M3" };
            var insumoDuplicado1 = new Insumo { Id = 20, CodigoFabrica = codigo, Descripcion = "STM32 BluePill" };
            var insumoDuplicado2 = new Insumo { Id = 30, CodigoFabrica = codigo, Descripcion = "STM32 Board" };

            _insumoRepoMock.Setup(r => r.FindAsync(It.IsAny<Expression<Func<Insumo, bool>>>()))
                           .ReturnsAsync(new List<Insumo> { insumoPrincipal, insumoDuplicado1, insumoDuplicado2 });

            _movRepoMock.Setup(m => m.MigrateMovimientosAsync(It.IsAny<int[]>(), 10))
                        .Returns(Task.CompletedTask);

            _movRepoMock.Setup(m => m.GetStockByInsumoAsync(10))
                        .ReturnsAsync(45);

            _movRepoMock.Setup(m => m.AddAsync(It.IsAny<MovimientoInventario>()))
                        .ReturnsAsync((MovimientoInventario m) => m);

            _insumoRepoMock.Setup(r => r.DeleteAsync(It.IsAny<int>()))
                           .Returns(Task.CompletedTask);

            _auditoriaServiceMock.Setup(a => a.LogAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                                 .Returns(Task.CompletedTask);

            // Act
            var result = await _service.UnificarDuplicadosAsync(codigo, 10);

            // Assert
            Assert.True(result.Success);
            Assert.Contains("Se unificaron 2 insumos correctamente", result.Message);

            // 1. Verificar que se migraron los movimientos de los IDs duplicados hacia el ID 10
            _movRepoMock.Verify(m => m.MigrateMovimientosAsync(
                It.Is<int[]>(ids => ids.Length == 2 && ids.Contains(20) && ids.Contains(30) && !ids.Contains(10)),
                10
            ), Times.Once);

            // 2. Verificar que se creó el movimiento informativo de TipoMovimiento.Unificacion
            _movRepoMock.Verify(m => m.AddAsync(It.Is<MovimientoInventario>(m =>
                m.IdInsumo == 10 &&
                m.TipoMovimiento == TipoMovimiento.Unificacion &&
                m.Cantidad == 0 &&
                m.UsuarioRegistro == "AdminUser"
            )), Times.Once);

            // 3. Verificar que se eliminaron los registros redundantes (20 y 30) y NO el principal (10)
            _insumoRepoMock.Verify(r => r.DeleteAsync(20), Times.Once);
            _insumoRepoMock.Verify(r => r.DeleteAsync(30), Times.Once);
            _insumoRepoMock.Verify(r => r.DeleteAsync(10), Times.Never);

            // 4. Verificar registro de auditoría
            _auditoriaServiceMock.Verify(a => a.LogAsync(
                "UNIFICAR",
                "Insumos",
                It.Is<string>(msg => msg.Contains("20") && msg.Contains("30") && msg.Contains("10")),
                "AdminUser"
            ), Times.Once);
        }

        [Fact]
        public async Task UnificarDuplicadosAsync_DebeCapturarExcepcion_YRetornarFail()
        {
            // Arrange
            var codigo = "ESP32-WROOM";
            _insumoRepoMock.Setup(r => r.FindAsync(It.IsAny<Expression<Func<Insumo, bool>>>()))
                           .ReturnsAsync(new List<Insumo>
                           {
                               new Insumo { Id = 1, CodigoFabrica = codigo },
                               new Insumo { Id = 2, CodigoFabrica = codigo }
                           });

            _movRepoMock.Setup(m => m.MigrateMovimientosAsync(It.IsAny<int[]>(), It.IsAny<int>()))
                        .ThrowsAsync(new InvalidOperationException("Error de conexión con la base de datos"));

            // Act
            var result = await _service.UnificarDuplicadosAsync(codigo, 1);

            // Assert
            Assert.False(result.Success);
            Assert.Contains("Error Interno de Servidor", result.Message);
            Assert.Contains("Error de conexión con la base de datos", result.Message);
        }
    }
}
