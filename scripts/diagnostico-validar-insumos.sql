-- ==========================================
-- DIAGNÓSTICO: Encontrar los Insumos huérfanos
-- ==========================================
USE [UDIT]
GO

PRINT '=== Insumos con id_nombreInsumo que NO existen en NombreInsumo ===';
SELECT
    i.[id] AS InsumoId,
    i.[cod_fabrica],
    i.[id_nombreInsumo] AS CategoriaIdReferenciado,
    i.[descripcion]
FROM [dbo].[Insumo] i
LEFT JOIN [dbo].[NombreInsumo] n ON i.[id_nombreInsumo] = n.[id]
WHERE n.[id] IS NULL;
GO

PRINT '=== Insumos con id_empaquetamiento que NO existen en Empaquetamiento ===';
SELECT
    i.[id] AS InsumoId,
    i.[cod_fabrica],
    i.[id_empaquetamiento] AS EmpaquetamientoIdReferenciado
FROM [dbo].[Insumo] i
LEFT JOIN [dbo].[Empaquetamiento] e ON i.[id_empaquetamiento] = e.[id]
WHERE e.[id] IS NULL;
GO

PRINT '=== Insumos con id_ubicacion que NO existen en Ubicacion ===';
SELECT
    i.[id] AS InsumoId,
    i.[cod_fabrica],
    i.[id_ubicacion] AS UbicacionIdReferenciado
FROM [dbo].[Insumo] i
LEFT JOIN [dbo].[Ubicacion] u ON i.[id_ubicacion] = u.[id]
WHERE u.[id] IS NULL;
GO

PRINT '=== IngresoInsumos con id_insumo que NO existen en Insumo ===';
SELECT
    ing.[id] AS IngresoId,
    ing.[id_insumo] AS InsumoIdReferenciado
FROM [dbo].[IngresoInsumos] ing
LEFT JOIN [dbo].[Insumo] i ON ing.[id_insumo] = i.[id]
WHERE i.[id] IS NULL;
GO

PRINT '=== SalidaInsumos con id_insumo que NO existen en Insumo ===';
SELECT
    s.[id] AS SalidaId,
    s.[id_insumo] AS InsumoIdReferenciado,
    s.[id_estado] AS EstadoSalidaIdReferenciado,
    s.[id_proyecto] AS ProyectoIdReferenciado
FROM [dbo].[SalidaInsumos] s
LEFT JOIN [dbo].[Insumo] i ON s.[id_insumo] = i.[id]
WHERE i.[id] IS NULL;
GO

PRINT '=== SalidaInsumos con id_estado que NO existen en EstadosSalidas ===';
SELECT
    s.[id] AS SalidaId,
    s.[id_estado] AS EstadoSalidaIdReferenciado
FROM [dbo].[SalidaInsumos] s
LEFT JOIN [dbo].[EstadosSalidas] es ON s.[id_estado] = es.[id]
WHERE es.[id] IS NULL;
GO

PRINT '=== SalidaInsumos con id_proyecto que NO existen en Proyectos ===';
SELECT
    s.[id] AS SalidaId,
    s.[id_proyecto] AS ProyectoIdReferenciado
FROM [dbo].[SalidaInsumos] s
LEFT JOIN [dbo].[Proyectos] p ON s.[id_proyecto] = p.[Id]
WHERE p.[Id] IS NULL;
GO
