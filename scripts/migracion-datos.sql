-- ==========================================
-- SCRIPT DE MIGRACIÓN: UDIT → UDIT_Inventario_V2
--
-- ⚠️ ABRIR UNA VENTANA DE CONSULTA NUEVA EN SSMS
--    (no reusar una ventana donde ya hayas corrido
--     este script antes)
-- ==========================================

USE [UDIT_Inventario_V2]
GO

-- ==========================================
-- 0. RESET DE SEGURIDAD: Apagar IDENTITY_INSERT
--    de todas las tablas por si quedó activo
--    de una ejecución anterior.
-- ==========================================
SET IDENTITY_INSERT [dbo].[CategoriaInsumo] OFF;
SET IDENTITY_INSERT [dbo].[Empaquetamiento] OFF;
SET IDENTITY_INSERT [dbo].[Ubicacion] OFF;
SET IDENTITY_INSERT [dbo].[TipoCompra] OFF;
SET IDENTITY_INSERT [dbo].[EstadoSalida] OFF;
SET IDENTITY_INSERT [dbo].[EstadoProyecto] OFF;
SET IDENTITY_INSERT [dbo].[Proveedor] OFF;
SET IDENTITY_INSERT [dbo].[Personal] OFF;
SET IDENTITY_INSERT [dbo].[Proyecto] OFF;
SET IDENTITY_INSERT [dbo].[Insumo] OFF;
SET IDENTITY_INSERT [dbo].[MovimientoInventario] OFF;
GO

-- ==========================================
-- 1. LIMPIAR DATOS EXISTENTES (orden inverso FK)
-- ==========================================
PRINT '=== LIMPIANDO DATOS EXISTENTES ===';

DELETE FROM [dbo].[MovimientoInventario];
DELETE FROM [dbo].[Insumo];
DELETE FROM [dbo].[Proyecto];
DELETE FROM [dbo].[Personal];
DELETE FROM [dbo].[Proveedor];
DELETE FROM [dbo].[EstadoProyecto];
DELETE FROM [dbo].[EstadoSalida];
DELETE FROM [dbo].[TipoCompra];
DELETE FROM [dbo].[Ubicacion];
DELETE FROM [dbo].[Empaquetamiento];
DELETE FROM [dbo].[CategoriaInsumo];
GO

-- Reiniciar IDENTITY para empezar desde 1
DBCC CHECKIDENT ('dbo.CategoriaInsumo', RESEED, 0);
DBCC CHECKIDENT ('dbo.Empaquetamiento', RESEED, 0);
DBCC CHECKIDENT ('dbo.Ubicacion', RESEED, 0);
DBCC CHECKIDENT ('dbo.TipoCompra', RESEED, 0);
DBCC CHECKIDENT ('dbo.EstadoSalida', RESEED, 0);
DBCC CHECKIDENT ('dbo.EstadoProyecto', RESEED, 0);
DBCC CHECKIDENT ('dbo.Proveedor', RESEED, 0);
DBCC CHECKIDENT ('dbo.Personal', RESEED, 0);
DBCC CHECKIDENT ('dbo.Proyecto', RESEED, 0);
DBCC CHECKIDENT ('dbo.Insumo', RESEED, 0);
DBCC CHECKIDENT ('dbo.MovimientoInventario', RESEED, 0);
GO

PRINT '=== DATOS LIMPIADOS, INICIANDO MIGRACIÓN ===';
GO

-- ==========================================
-- 2. MIGRAR CATÁLOGOS
-- ==========================================

SET IDENTITY_INSERT [dbo].[CategoriaInsumo] ON;
INSERT INTO [dbo].[CategoriaInsumo] ([Id], [Nombre])
SELECT [id], [nombreInsumo] FROM [UDIT].[dbo].[NombreInsumo];
SET IDENTITY_INSERT [dbo].[CategoriaInsumo] OFF;
GO

SET IDENTITY_INSERT [dbo].[Empaquetamiento] ON;
INSERT INTO [dbo].[Empaquetamiento] ([Id], [Tipo])
SELECT [id], [tipo] FROM [UDIT].[dbo].[Empaquetamiento];
SET IDENTITY_INSERT [dbo].[Empaquetamiento] OFF;
GO

SET IDENTITY_INSERT [dbo].[Ubicacion] ON;
INSERT INTO [dbo].[Ubicacion] ([Id], [Nombre])
SELECT [id], [ubicacion] FROM [UDIT].[dbo].[Ubicacion];
SET IDENTITY_INSERT [dbo].[Ubicacion] OFF;
GO

SET IDENTITY_INSERT [dbo].[TipoCompra] ON;
INSERT INTO [dbo].[TipoCompra] ([Id], [Nombre])
SELECT [id], [nombre] FROM [UDIT].[dbo].[TipoCompra];
SET IDENTITY_INSERT [dbo].[TipoCompra] OFF;
GO

SET IDENTITY_INSERT [dbo].[EstadoSalida] ON;
INSERT INTO [dbo].[EstadoSalida] ([Id], [Nombre])
SELECT [id], [nombre] FROM [UDIT].[dbo].[EstadosSalidas];
SET IDENTITY_INSERT [dbo].[EstadoSalida] OFF;
GO

SET IDENTITY_INSERT [dbo].[EstadoProyecto] ON;
INSERT INTO [dbo].[EstadoProyecto] ([Id], [Estado])
SELECT [id], [estado] FROM [UDIT].[dbo].[EstadoProyectos];
SET IDENTITY_INSERT [dbo].[EstadoProyecto] OFF;
GO

SET IDENTITY_INSERT [dbo].[Proveedor] ON;
INSERT INTO [dbo].[Proveedor] ([Id], [Nombre], [Contacto], [Direccion])
SELECT [Id], [Nombre], [Contacto], [Direccion] FROM [UDIT].[dbo].[Proveedor];
SET IDENTITY_INSERT [dbo].[Proveedor] OFF;
GO

SET IDENTITY_INSERT [dbo].[Personal] ON;
INSERT INTO [dbo].[Personal] ([Id], [Nombre], [Cargo])
SELECT [Id], [Nombre], [Cargo] FROM [UDIT].[dbo].[Personal];
SET IDENTITY_INSERT [dbo].[Personal] OFF;
GO

-- ==========================================
-- 3. MIGRAR PROYECTOS
-- ==========================================

SET IDENTITY_INSERT [dbo].[Proyecto] ON;
INSERT INTO [dbo].[Proyecto] ([Id], [Nombre], [Descripcion], [IdEstado], [FechaCreacion])
SELECT [Id], [Nombre], [Descripcion], [idEstado], ISNULL([FechaCreacion], GETDATE())
FROM [UDIT].[dbo].[Proyectos];
SET IDENTITY_INSERT [dbo].[Proyecto] OFF;
GO

-- ==========================================
-- 4. MIGRAR INSUMOS
-- ==========================================

SET IDENTITY_INSERT [dbo].[Insumo] ON;
INSERT INTO [dbo].[Insumo] ([Id], [IdCategoria], [CodigoFabrica], [IdEmpaquetamiento], [IdUbicacion], [Descripcion], [PrecioReferencia])
SELECT
    i.[id],
    i.[id_nombreInsumo],
    i.[cod_fabrica],
    i.[id_empaquetamiento],
    i.[id_ubicacion],
    i.[descripcion],
    TRY_CAST(REPLACE(LTRIM(RTRIM(i.[valor])), ',', '.') AS DECIMAL(18,2))
FROM [UDIT].[dbo].[Insumo] i
-- Solo migrar insumos que tengan una categoría válida en la BD vieja
WHERE EXISTS (SELECT 1 FROM [UDIT].[dbo].[NombreInsumo] n WHERE n.[id] = i.[id_nombreInsumo]);
SET IDENTITY_INSERT [dbo].[Insumo] OFF;
GO

-- ==========================================
-- 5. MIGRAR KARDEX
-- ==========================================

-- 5a. INGRESOS
INSERT INTO [dbo].[MovimientoInventario]
    ([IdInsumo], [TipoMovimiento], [Cantidad], [Fecha], [PrecioUnitario], [IdProveedor], [IdTipoCompra], [IdProyecto])
SELECT
    [id_insumo],
    'INGRESO',
    [cantidad],
    [Fecha],
    TRY_CAST([PrecioUnit] AS DECIMAL(18,2)),
    [id_proveedor],
    [id_tipo_compra],
    [idProyecto]
FROM [UDIT].[dbo].[IngresoInsumos];
GO

-- 5b. SALIDAS
INSERT INTO [dbo].[MovimientoInventario]
    ([IdInsumo], [TipoMovimiento], [Cantidad], [Fecha], [Observacion], [IdProyecto], [IdEstadoSalida])
SELECT
    [id_insumo],
    'SALIDA',
    [cantidad],
    [fecha],
    [descripcion],
    [id_proyecto],
    [id_estado]
FROM [UDIT].[dbo].[SalidaInsumos];
GO

-- ==========================================
-- 6. VALIDACIÓN
-- ==========================================
PRINT '';
PRINT '========================================';
PRINT '=== RESUMEN DE MIGRACIÓN ===';
PRINT '========================================';

SELECT 'CategoriaInsumo' AS Tabla, COUNT(*) AS Total FROM [dbo].[CategoriaInsumo]
UNION ALL SELECT 'Empaquetamiento', COUNT(*) FROM [dbo].[Empaquetamiento]
UNION ALL SELECT 'Ubicacion', COUNT(*) FROM [dbo].[Ubicacion]
UNION ALL SELECT 'TipoCompra', COUNT(*) FROM [dbo].[TipoCompra]
UNION ALL SELECT 'EstadoSalida', COUNT(*) FROM [dbo].[EstadoSalida]
UNION ALL SELECT 'EstadoProyecto', COUNT(*) FROM [dbo].[EstadoProyecto]
UNION ALL SELECT 'Proveedor', COUNT(*) FROM [dbo].[Proveedor]
UNION ALL SELECT 'Personal', COUNT(*) FROM [dbo].[Personal]
UNION ALL SELECT 'Proyecto', COUNT(*) FROM [dbo].[Proyecto]
UNION ALL SELECT 'Insumo', COUNT(*) FROM [dbo].[Insumo]
UNION ALL SELECT 'MovInventario (INGRESO)', COUNT(*) FROM [dbo].[MovimientoInventario] WHERE TipoMovimiento = 'INGRESO'
UNION ALL SELECT 'MovInventario (SALIDA)', COUNT(*) FROM [dbo].[MovimientoInventario] WHERE TipoMovimiento = 'SALIDA'
ORDER BY Tabla;
GO
