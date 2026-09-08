using Application.Common.Interfaces;
using Application.DTOs;
using Application.Interfaces;
using Application.Services;
using Domain.Entities;
using Domain.Entities.Catalogos;
using Moq;
using System.Collections.Generic;
using System.IO;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;
using Xunit;

namespace Application.Tests
{
    public class ExcelParserServiceTests
    {
        private readonly Mock<IInsumoRepository> _insumoRepoMock;
        private readonly Mock<IMovimientoRepository> _movRepoMock;
        private readonly Mock<IBaseRepository<CategoriaInsumo>> _categoriaRepoMock;
        private readonly Mock<IBaseRepository<Empaquetamiento>> _empaquetamientoRepoMock;
        private readonly Mock<IBaseRepository<UnidadMedida>> _unidadMedidaRepoMock;
        private readonly Mock<IBaseRepository<Proveedor>> _proveedorRepoMock;
        private readonly Mock<IBaseRepository<TipoCompra>> _tipoCompraRepoMock;
        private readonly Mock<IBaseRepository<Ubicacion>> _ubicacionRepoMock;
        private readonly ExcelParserService _service;

        public ExcelParserServiceTests()
        {
            _insumoRepoMock = new Mock<IInsumoRepository>();
            _movRepoMock = new Mock<IMovimientoRepository>();
            _categoriaRepoMock = new Mock<IBaseRepository<CategoriaInsumo>>();
            _empaquetamientoRepoMock = new Mock<IBaseRepository<Empaquetamiento>>();
            _unidadMedidaRepoMock = new Mock<IBaseRepository<UnidadMedida>>();
            _proveedorRepoMock = new Mock<IBaseRepository<Proveedor>>();
            _tipoCompraRepoMock = new Mock<IBaseRepository<TipoCompra>>();
            _ubicacionRepoMock = new Mock<IBaseRepository<Ubicacion>>();

            _categoriaRepoMock.Setup(r => r.GetAllAsync())
                .ReturnsAsync(new List<CategoriaInsumo> { new CategoriaInsumo { Id = 1, Nombre = "Circuitos Integrados" } });
            _empaquetamientoRepoMock.Setup(r => r.GetAllAsync())
                .ReturnsAsync(new List<Empaquetamiento> { new Empaquetamiento { Id = 1, Tipo = "DIP-8" } });
            _unidadMedidaRepoMock.Setup(r => r.GetAllAsync())
                .ReturnsAsync(new List<UnidadMedida> { new UnidadMedida { Id = 1, Nombre = "Unidad", IdCategoria = 1 } });
            _proveedorRepoMock.Setup(r => r.GetAllAsync())
                .ReturnsAsync(new List<Proveedor> { new Proveedor { Id = 1, Nombre = "Prueba" } });
            _tipoCompraRepoMock.Setup(r => r.GetAllAsync())
                .ReturnsAsync(new List<TipoCompra> { new TipoCompra { Id = 1, Nombre = "Ajuste Inventario" }, new TipoCompra { Id = 2, Nombre = "Internet" } });
            _ubicacionRepoMock.Setup(r => r.GetAllAsync())
                .ReturnsAsync(new List<Ubicacion> { new Ubicacion { Id = 1, Nombre = "A-01-03-34-23" } });

            _service = new ExcelParserService(
                _insumoRepoMock.Object,
                _movRepoMock.Object,
                _categoriaRepoMock.Object,
                _empaquetamientoRepoMock.Object,
                _unidadMedidaRepoMock.Object,
                _proveedorRepoMock.Object,
                _tipoCompraRepoMock.Object,
                _ubicacionRepoMock.Object);
        }

        [Fact]
        public async Task ProcesarExcelIngresoAsync_ShouldParseXmlSpreadsheetWithTechnicalColumnsAndPreFill()
        {
            string xml = @"<?xml version=""1.0"" encoding=""UTF-8""?>
<?mso-application progid=""Excel.Sheet""?>
<Workbook xmlns=""urn:schemas-microsoft-com:office:spreadsheet""
 xmlns:ss=""urn:schemas-microsoft-com:office:spreadsheet"">
 <Worksheet ss:Name=""Ingreso_Insumos"">
  <Table>
   <Row><Cell ss:MergeAcross=""10""><Data ss:Type=""String"">PLANTILLA OFICIAL DE CARGA MASIVA DE INGRESOS — INVENTARIO UDIT</Data></Cell></Row>
   <Row><Cell ss:MergeAcross=""10""><Data ss:Type=""String"">Diligencie las columnas respetando el codigo de fabricante y las cantidades mayores a 0.</Data></Cell></Row>
   <Row></Row>
   <Row>
    <Cell><Data ss:Type=""String"">CodigoFabrica *</Data></Cell>
    <Cell><Data ss:Type=""String"">Descripcion</Data></Cell>
    <Cell><Data ss:Type=""String"">Categoria</Data></Cell>
    <Cell><Data ss:Type=""String"">Empaquetamiento</Data></Cell>
    <Cell><Data ss:Type=""String"">ValorMedida</Data></Cell>
    <Cell><Data ss:Type=""String"">UnidadMedida</Data></Cell>
    <Cell><Data ss:Type=""String"">Cantidad *</Data></Cell>
    <Cell><Data ss:Type=""String"">PrecioUnitario</Data></Cell>
    <Cell><Data ss:Type=""String"">Proveedor</Data></Cell>
    <Cell><Data ss:Type=""String"">TipoCompra</Data></Cell>
    <Cell><Data ss:Type=""String"">Observacion</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type=""String"">NE555P_NUEVO</Data></Cell>
    <Cell><Data ss:Type=""String"">Temporizador de precisión</Data></Cell>
    <Cell><Data ss:Type=""String"">Circuitos Integrados</Data></Cell>
    <Cell><Data ss:Type=""String"">DIP-8</Data></Cell>
    <Cell><Data ss:Type=""Number"">8</Data></Cell>
    <Cell><Data ss:Type=""String"">Pines</Data></Cell>
    <Cell><Data ss:Type=""Number"">50</Data></Cell>
    <Cell><Data ss:Type=""Number"">1200</Data></Cell>
    <Cell><Data ss:Type=""String"">Prueba</Data></Cell>
    <Cell><Data ss:Type=""String"">Ajuste Inventario</Data></Cell>
    <Cell><Data ss:Type=""String"">Lote nuevo</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>";

            using var stream = new MemoryStream(Encoding.UTF8.GetBytes(xml));

            // Act
            var result = await _service.ProcesarExcelIngresoAsync(stream, "Plantilla_Ingreso_Masivo_UDIT.xls");

            // Assert
            Assert.True(result.Success);
            Assert.NotNull(result.Data);
            Assert.Equal(1, result.Data.TotalFilas);
            var item = result.Data.Filas[0];
            Assert.Equal("NE555P_NUEVO", item.CodigoFabrica);
            Assert.Equal("Temporizador de precisión", item.Descripcion);
            Assert.Equal(1, item.IdCategoria);
            Assert.Equal("Circuitos Integrados", item.CategoriaNombre);
            Assert.Equal(1, item.IdEmpaquetamiento);
            Assert.Equal("DIP-8", item.EmpaquetamientoNombre);
            Assert.Equal(8m, item.ValorMedida);
            Assert.Equal(50, item.Cantidad);
            Assert.Equal(1200m, item.PrecioUnitario);
            Assert.Equal(1, item.IdProveedor);
            Assert.False(item.InsumoExiste);
            Assert.Equal("INSUMO_NO_REGISTRADO", item.EstadoValidacion);
        }
    }
}
