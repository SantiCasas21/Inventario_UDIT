using Application.Common.Helpers;
using Application.DTOs;
using Domain.Entities;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using Xunit;

namespace Application.Tests
{
    public class FilterExpressionBuilderTests
    {
        [Fact]
        public void BuildInsumoFilter_ShouldFilterByIdsCategoria()
        {
            // Arrange
            var insumos = new List<Insumo>
            {
                new Insumo { Id = 1, IdCategoria = 10, CodigoFabrica = "RES-01" },
                new Insumo { Id = 2, IdCategoria = 20, CodigoFabrica = "CAP-01" },
                new Insumo { Id = 3, IdCategoria = 10, CodigoFabrica = "RES-02" },
            }.AsQueryable();

            var filter = new InsumoFilterDto
            {
                IdsCategoria = new List<int> { 10 }
            };

            // Act
            var predicate = FilterExpressionBuilder.BuildInsumoFilter(filter);
            var filtered = insumos.Where(predicate).ToList();

            // Assert
            Assert.Equal(2, filtered.Count);
            Assert.All(filtered, item => Assert.Equal(10, item.IdCategoria));
        }

        [Fact]
        public void BuildInsumoFilter_ShouldFilterByValorMedidaRange()
        {
            // Arrange
            var insumos = new List<Insumo>
            {
                new Insumo { Id = 1, ValorMedida = 100, CodigoFabrica = "R100" },
                new Insumo { Id = 2, ValorMedida = 220, CodigoFabrica = "R220" },
                new Insumo { Id = 3, ValorMedida = 500, CodigoFabrica = "R500" },
            }.AsQueryable();

            var filter = new InsumoFilterDto
            {
                ValorMedidaMin = 150,
                ValorMedidaMax = 600
            };

            // Act
            var predicate = FilterExpressionBuilder.BuildInsumoFilter(filter);
            var filtered = insumos.Where(predicate).ToList();

            // Assert
            Assert.Equal(2, filtered.Count);
            Assert.Contains(filtered, i => i.CodigoFabrica == "R220");
            Assert.Contains(filtered, i => i.CodigoFabrica == "R500");
        }

        [Fact]
        public void BuildMovimientoFilter_ShouldFilterByTipoAndCodigoFabrica()
        {
            // Arrange
            var insumo1 = new Insumo { Id = 1, CodigoFabrica = "FAB-ABC" };
            var insumo2 = new Insumo { Id = 2, CodigoFabrica = "FAB-XYZ" };

            var movimientos = new List<MovimientoInventario>
            {
                new MovimientoInventario { Id = 1, IdInsumo = 1, Insumo = insumo1, TipoMovimiento = TipoMovimiento.Ingreso, Cantidad = 10 },
                new MovimientoInventario { Id = 2, IdInsumo = 2, Insumo = insumo2, TipoMovimiento = TipoMovimiento.Salida, Cantidad = 5 },
                new MovimientoInventario { Id = 3, IdInsumo = 1, Insumo = insumo1, TipoMovimiento = TipoMovimiento.Ajuste, Cantidad = 2 },
            }.AsQueryable();

            var filter = new MovimientoFilterDto
            {
                TiposMovimiento = new List<string> { "INGRESO", "AJUSTE" },
                CodigoFabricaSearch = "ABC"
            };

            // Act
            var predicate = FilterExpressionBuilder.BuildMovimientoFilter(filter);
            var filtered = movimientos.Where(predicate).ToList();

            // Assert
            Assert.Equal(2, filtered.Count);
            Assert.All(filtered, m => Assert.Equal("FAB-ABC", m.Insumo.CodigoFabrica));
        }
    }
}
