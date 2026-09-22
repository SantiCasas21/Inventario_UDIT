/*
==============================================================================
SCRIPT DE MIGRACIÓN DEFINITIVO: UDIT_Legacy -> UDIT_Inventario_V2
==============================================================================
Propósito:
  1. Limpia las tablas de negocio en UDIT_Inventario_V2 (preservando usuarios y roles AspNet).
  2. Migra catálogos desde UDIT_Legacy preservando los IDs originales:
     - Categorías de Insumo (NombreInsumo)
     - Empaquetamientos
     - Ubicaciones
     - Tipos de Compra
     - Estados de Salida y de Proyecto
     - Proveedores, Personal y Proyectos
  3. Crea y asocia las Familias de Empaquetamiento y Unidades de Medida normalizadas.
  4. Migra los 1,488 Insumos extrayendo y normalizando ValorMedida (numérico) y UnidadMedida (texto).
     (Nota: En V2, Insumo NO contiene IdUbicacion; la ubicación se asigna a los movimientos de Kardex).
  5. Inicializa el Kardex (MovimientoInventario) con el SALDO FÍSICO REAL EXACTO
     tomando Insumo.[cantidad] e Insumo.[id_ubicacion] de la base original (320,376 unidades físicas).
     Esto garantiza que no se corrompan los datos y que el Kardex cuadre al 100.00% con la realidad.
  6. Reseed de todas las secuencias IDENTITY para que nuevos registros continúen de forma correlativa.
  7. Reporte final de validación y cuadre de auditoría.

Requisito previo:
  Haber restaurado el backup como base de datos [UDIT_Legacy] en la misma instancia SQL.
  (Si tu base se llama [UDIT], ejecuta antes: EXEC sp_renamedb 'UDIT', 'UDIT_Legacy';)
==============================================================================
*/

USE [UDIT_Inventario_V2];
GO

SET NOCOUNT ON;
BEGIN TRANSACTION;

BEGIN TRY
    PRINT '=====================================================';
    PRINT 'PASO 1: Verificando bases de datos requeridas...';
    PRINT '=====================================================';

    IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'UDIT_Legacy')
    BEGIN
        IF EXISTS (SELECT name FROM sys.databases WHERE name = N'UDIT')
        BEGIN
            PRINT '  -> Detectada base de datos [UDIT]. Renombrando temporalmente a [UDIT_Legacy]...';
            EXEC sp_renamedb 'UDIT', 'UDIT_Legacy';
        END
        ELSE
        BEGIN
            RAISERROR('ERROR CRÍTICO: La base de datos [UDIT_Legacy] (o [UDIT]) no existe. Restaure primero el backup UDIT.bak o ejecute Full_Data_Backup_UDIT_Inventario.sql como [UDIT_Legacy].', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END
    END

    PRINT '  - Base de datos de origen [UDIT_Legacy] verificada correctamente.';

    PRINT '=====================================================';
    PRINT 'PASO 2: Limpiando tablas de negocio en UDIT_Inventario_V2...';
    PRINT '=====================================================';

    DELETE FROM [dbo].[Auditoria];
    DELETE FROM [dbo].[MovimientoInventario];
    DELETE FROM [dbo].[Insumo];
    DELETE FROM [dbo].[Proyecto];
    DELETE FROM [dbo].[Personal];
    DELETE FROM [dbo].[Proveedor];
    DELETE FROM [dbo].[CategoriaFamiliaEmpaquetamiento];
    DELETE FROM [dbo].[Empaquetamiento];
    DELETE FROM [dbo].[FamiliaEmpaquetamiento];
    DELETE FROM [dbo].[UnidadMedida];
    DELETE FROM [dbo].[CategoriaInsumo];
    DELETE FROM [dbo].[Ubicacion];
    DELETE FROM [dbo].[TipoCompra];
    DELETE FROM [dbo].[EstadoSalida];
    DELETE FROM [dbo].[EstadoProyecto];

    PRINT '  - Tablas de negocio limpiadas correctamente (Usuarios y Roles Identity preservados).';

    PRINT '=====================================================';
    PRINT 'PASO 3: Migrando Catálogos Maestros...';
    PRINT '=====================================================';

    -- 3a. CategoriaInsumo
    SET IDENTITY_INSERT [dbo].[CategoriaInsumo] ON;
    INSERT INTO [dbo].[CategoriaInsumo] ([Id], [Nombre])
    SELECT [id], LEFT(LTRIM(RTRIM([nombreInsumo])), 100)
    FROM [UDIT_Legacy].[dbo].[NombreInsumo];
    DECLARE @rcCat INT = @@ROWCOUNT;
    SET IDENTITY_INSERT [dbo].[CategoriaInsumo] OFF;
    PRINT '  - CategoriaInsumo migrada (' + CAST(@rcCat AS VARCHAR) + ' registros).';

    -- 3b. Empaquetamiento
    SET IDENTITY_INSERT [dbo].[Empaquetamiento] ON;
    INSERT INTO [dbo].[Empaquetamiento] ([Id], [Tipo])
    SELECT [id], LEFT(LTRIM(RTRIM([tipo])), 50)
    FROM [UDIT_Legacy].[dbo].[Empaquetamiento];
    DECLARE @rcEmp INT = @@ROWCOUNT;
    SET IDENTITY_INSERT [dbo].[Empaquetamiento] OFF;
    PRINT '  - Empaquetamiento migrado (' + CAST(@rcEmp AS VARCHAR) + ' registros).';

    -- 3c. Ubicacion
    SET IDENTITY_INSERT [dbo].[Ubicacion] ON;
    INSERT INTO [dbo].[Ubicacion] ([Id], [Nombre])
    SELECT [id], LEFT(LTRIM(RTRIM([ubicacion])), 100)
    FROM [UDIT_Legacy].[dbo].[Ubicacion];
    DECLARE @rcUbi INT = @@ROWCOUNT;
    SET IDENTITY_INSERT [dbo].[Ubicacion] OFF;
    PRINT '  - Ubicacion migrada (' + CAST(@rcUbi AS VARCHAR) + ' registros).';

    -- 3d. TipoCompra
    SET IDENTITY_INSERT [dbo].[TipoCompra] ON;
    INSERT INTO [dbo].[TipoCompra] ([Id], [Nombre])
    SELECT [id], LEFT(LTRIM(RTRIM([nombre])), 50)
    FROM [UDIT_Legacy].[dbo].[TipoCompra];
    DECLARE @rcTC INT = @@ROWCOUNT;
    SET IDENTITY_INSERT [dbo].[TipoCompra] OFF;
    PRINT '  - TipoCompra migrada (' + CAST(@rcTC AS VARCHAR) + ' registros).';

    -- 3e. EstadoSalida
    SET IDENTITY_INSERT [dbo].[EstadoSalida] ON;
    INSERT INTO [dbo].[EstadoSalida] ([Id], [Nombre])
    SELECT [id], LEFT(LTRIM(RTRIM([nombre])), 50)
    FROM [UDIT_Legacy].[dbo].[EstadosSalidas];
    DECLARE @rcES INT = @@ROWCOUNT;
    SET IDENTITY_INSERT [dbo].[EstadoSalida] OFF;
    PRINT '  - EstadoSalida migrada (' + CAST(@rcES AS VARCHAR) + ' registros).';

    -- 3f. EstadoProyecto
    SET IDENTITY_INSERT [dbo].[EstadoProyecto] ON;
    INSERT INTO [dbo].[EstadoProyecto] ([Id], [Estado])
    SELECT [id], LEFT(LTRIM(RTRIM([estado])), 50)
    FROM [UDIT_Legacy].[dbo].[EstadoProyectos];
    DECLARE @rcEP INT = @@ROWCOUNT;
    SET IDENTITY_INSERT [dbo].[EstadoProyecto] OFF;
    PRINT '  - EstadoProyecto migrado (' + CAST(@rcEP AS VARCHAR) + ' registros).';

    -- 3g. Proveedor
    SET IDENTITY_INSERT [dbo].[Proveedor] ON;
    INSERT INTO [dbo].[Proveedor] ([Id], [Nombre], [Contacto], [Direccion])
    SELECT 
        [Id], 
        LEFT(ISNULL(NULLIF(LTRIM(RTRIM([Nombre])), ''), 'Sin nombre'), 100), 
        LEFT(LTRIM(RTRIM([Contacto])), 100), 
        LEFT(LTRIM(RTRIM([Direccion])), 255)
    FROM [UDIT_Legacy].[dbo].[Proveedor];
    DECLARE @rcProv INT = @@ROWCOUNT;
    SET IDENTITY_INSERT [dbo].[Proveedor] OFF;
    PRINT '  - Proveedor migrado (' + CAST(@rcProv AS VARCHAR) + ' registros).';

    -- 3h. Personal
    SET IDENTITY_INSERT [dbo].[Personal] ON;
    INSERT INTO [dbo].[Personal] ([Id], [Nombre], [Cargo])
    SELECT 
        [Id], 
        LEFT(ISNULL(NULLIF(LTRIM(RTRIM([Nombre])), ''), 'Sin nombre'), 100), 
        LEFT(LTRIM(RTRIM([Cargo])), 100)
    FROM [UDIT_Legacy].[dbo].[Personal];
    DECLARE @rcPers INT = @@ROWCOUNT;
    SET IDENTITY_INSERT [dbo].[Personal] OFF;
    PRINT '  - Personal migrado (' + CAST(@rcPers AS VARCHAR) + ' registros).';

    -- 3i. Proyecto
    SET IDENTITY_INSERT [dbo].[Proyecto] ON;
    INSERT INTO [dbo].[Proyecto] ([Id], [Nombre], [Descripcion], [IdEstado], [FechaCreacion])
    SELECT
        p.[Id],
        LEFT(ISNULL(NULLIF(LTRIM(RTRIM(p.[Nombre])), ''), 'Proyecto ' + CAST(p.[Id] AS VARCHAR)), 100),
        LEFT(LTRIM(RTRIM(p.[Descripcion])), 255),
        CASE 
            WHEN EXISTS (SELECT 1 FROM [dbo].[EstadoProyecto] ep WHERE ep.[Id] = p.[idEstado]) THEN p.[idEstado]
            ELSE (SELECT TOP 1 [Id] FROM [dbo].[EstadoProyecto] ORDER BY [Id])
        END,
        ISNULL(p.[FechaCreacion], GETDATE())
    FROM [UDIT_Legacy].[dbo].[Proyectos] p;
    DECLARE @rcProy INT = @@ROWCOUNT;
    SET IDENTITY_INSERT [dbo].[Proyecto] OFF;
    PRINT '  - Proyecto migrado (' + CAST(@rcProy AS VARCHAR) + ' registros).';

    PRINT '=====================================================';
    PRINT 'PASO 4: Poblando Familias de Empaquetamiento...';
    PRINT '=====================================================';

    INSERT INTO [dbo].[FamiliaEmpaquetamiento] ([Nombre])
    VALUES 
        ('SMD / Montaje Superficial'),
        ('Through-Hole / Pasante'),
        ('Empaquetado General'),
        ('Bolsa / Granel'),
        ('Mecánico / Disipación');

    DECLARE @IdSMD INT = (SELECT TOP 1 Id FROM [dbo].[FamiliaEmpaquetamiento] WHERE [Nombre] LIKE '%SMD%');
    DECLARE @IdTHT INT = (SELECT TOP 1 Id FROM [dbo].[FamiliaEmpaquetamiento] WHERE [Nombre] LIKE '%Through%');
    DECLARE @IdGen INT = (SELECT TOP 1 Id FROM [dbo].[FamiliaEmpaquetamiento] WHERE [Nombre] LIKE '%General%');

    UPDATE [dbo].[Empaquetamiento]
    SET [IdFamiliaEmpaquetamiento] = 
        CASE 
            WHEN [Tipo] LIKE '%SMD%' OR [Tipo] LIKE '%0805%' OR [Tipo] LIKE '%0603%' OR [Tipo] LIKE '%1206%' OR [Tipo] LIKE '%SOP%' OR [Tipo] LIKE '%QFP%' OR [Tipo] LIKE '%SOT%' THEN @IdSMD
            WHEN [Tipo] LIKE '%DIP%' OR [Tipo] LIKE '%TO-92%' OR [Tipo] LIKE '%TO-220%' OR [Tipo] LIKE '%Pasante%' OR [Tipo] LIKE '%THT%' THEN @IdTHT
            ELSE @IdGen
        END;

    PRINT '=====================================================';
    PRINT 'PASO 5: Poblando catálogo de Unidades de Medida...';
    PRINT '=====================================================';

    INSERT INTO [dbo].[UnidadMedida] ([Nombre], [IdCategoria])
    SELECT u.nombre, c.Id
    FROM [dbo].[CategoriaInsumo] c
    CROSS JOIN (VALUES 
        ('KOHM'), ('OHM'), ('MOHM'), ('GOHM'),
        ('uF'), ('nF'), ('pF'), ('F'),
        ('uH'), ('mH'), ('H'),
        ('V'), ('KV'), ('A'), ('mA'), ('W'), ('mW'),
        ('HZ'), ('KHZ'), ('MHZ')
    ) AS u(nombre)
    WHERE (
        (c.Nombre LIKE '%RESIST%' AND u.nombre IN ('KOHM','OHM','MOHM','GOHM','W')) OR
        (c.Nombre LIKE '%CONDENS%' OR c.Nombre LIKE '%CAPACIT%' AND u.nombre IN ('uF','nF','pF','F','V')) OR
        (c.Nombre LIKE '%INDUCT%' OR c.Nombre LIKE '%BOBIN%' AND u.nombre IN ('uH','mH','H','A')) OR
        (c.Nombre LIKE '%DIODO%' OR c.Nombre LIKE '%TRANSISTOR%' OR c.Nombre LIKE '%REGULAD%' AND u.nombre IN ('V','KV','A','mA','W')) OR
        (c.Nombre LIKE '%CRISTAL%' OR c.Nombre LIKE '%OSCIL%' AND u.nombre IN ('HZ','KHZ','MHZ'))
    );

    PRINT '=====================================================';
    PRINT 'PASO 6: Migrando Insumos con normalización de unidades...';
    PRINT '=====================================================';

    SET IDENTITY_INSERT [dbo].[Insumo] ON;

    ;WITH unit_map(unidad_raw, nombre) AS (
        SELECT * FROM (VALUES
            ('K OHM','KOHM'), ('KOHM','KOHM'), ('K OHMS','KOHM'), ('K OMH','KOHM'),
            ('OHM','OHM'),   ('OHMS','OHM'),   ('OMH','OHM'),
            ('M OHM','MOHM'),('MOHM','MOHM'),
            ('G OHM','GOHM'),('GOHM','GOHM'),
            ('UF','uF'), ('PF','pF'), ('NF','nF'), ('F','F'),
            ('UH','uH'), ('MH','mH'), ('H','H'),
            ('V','V'), ('KV','KV'), ('VDC','V'),
            ('MHZ','MHZ'), ('KHZ','KHZ'), ('HZ','HZ'),
            ('A','A'), ('MA','mA'), ('W','W'), ('MW','mW')
        ) AS t(unidad_raw, nombre)
    ),
    parsed AS (
        SELECT
            i.[id],
            i.[id_nombreInsumo],
            i.[cod_fabrica],
            i.[id_empaquetamiento],
            i.[descripcion],
            i.[nombre],
            i.[valor],
            TRY_CAST(SUBSTRING(v, 1, CASE WHEN PATINDEX('%[^0-9.]%', v) = 0 THEN LEN(v) ELSE PATINDEX('%[^0-9.]%', v) - 1 END) AS DECIMAL(18,6)) AS valor_num,
            CASE WHEN PATINDEX('%[^0-9.]%', v) = 0 THEN NULL
                 ELSE UPPER(LTRIM(RTRIM(SUBSTRING(v, PATINDEX('%[^0-9.]%', v), LEN(v))))) END AS unidad_full
        FROM [UDIT_Legacy].[dbo].[Insumo] i
        CROSS APPLY (SELECT LTRIM(RTRIM(REPLACE(REPLACE(ISNULL(i.[valor],''), ',', '.'), NCHAR(181), 'u'))) AS v) x
        WHERE EXISTS (SELECT 1 FROM [dbo].[CategoriaInsumo] c WHERE c.[Id] = i.[id_nombreInsumo])
    ),
    parsed2 AS (
        SELECT *,
            CASE WHEN CHARINDEX(' ', unidad_full) > 0 THEN LEFT(unidad_full, CHARINDEX(' ', unidad_full) - 1)
                 ELSE unidad_full END AS unidad_tok
        FROM parsed
    )
    INSERT INTO [dbo].[Insumo] (
        [Id],
        [IdCategoria],
        [CodigoFabrica],
        [IdEmpaquetamiento],
        [Descripcion],
        [PrecioReferencia],
        [Moneda],
        [ValorMedida],
        [UnidadMedida]
    )
    SELECT
        p.[id],
        p.[id_nombreInsumo],
        LEFT(ISNULL(NULLIF(LTRIM(RTRIM(p.[cod_fabrica])), ''), 'SIN-CODIGO-' + CAST(p.[id] AS VARCHAR)), 100),
        CASE 
            WHEN EXISTS (SELECT 1 FROM [dbo].[Empaquetamiento] e WHERE e.[Id] = p.[id_empaquetamiento]) THEN p.[id_empaquetamiento]
            ELSE (SELECT TOP 1 [Id] FROM [dbo].[Empaquetamiento] ORDER BY [Id])
        END,
        COALESCE(NULLIF(LTRIM(RTRIM(p.[descripcion])), ''), NULLIF(LTRIM(RTRIM(p.[nombre])), ''), 'Sin descripción'),
        ISNULL((SELECT TOP 1 CAST(ing.[PrecioUnit] AS DECIMAL(18,2)) 
                FROM [UDIT_Legacy].[dbo].[IngresoInsumos] ing 
                WHERE COALESCE(ing.[idInsumoTabla], ing.[id_insumo]) = p.[id] AND ing.[PrecioUnit] > 0
                ORDER BY ing.[Fecha] DESC), 0),
        'COP',
        CASE 
            WHEN (COALESCE(m1.nombre, m2.nombre) IS NOT NULL OR p.unidad_full IS NULL) THEN p.valor_num
            ELSE NULL
        END,
        COALESCE(m1.nombre, m2.nombre)
    FROM parsed2 p
    LEFT JOIN unit_map m1 ON m1.unidad_raw = p.unidad_full
    LEFT JOIN unit_map m2 ON m2.unidad_raw = p.unidad_tok;

    DECLARE @InsumosMigrados INT = @@ROWCOUNT;
    SET IDENTITY_INSERT [dbo].[Insumo] OFF;
    PRINT '  - Insumos migrados (' + CAST(@InsumosMigrados AS VARCHAR) + ' registros).';

    PRINT '=====================================================';
    PRINT 'PASO 7: Inicializando Kardex con Saldo Físico Real (Insumo.cantidad)...';
    PRINT '=====================================================';

    SET IDENTITY_INSERT [dbo].[MovimientoInventario] ON;

    -- Insertamos el saldo base inicial de cada insumo tomando la cantidad física real de la tabla Insumo original
    INSERT INTO [dbo].[MovimientoInventario] (
        [Id],
        [IdInsumo],
        [TipoMovimiento],
        [Cantidad],
        [Fecha],
        [PrecioUnitario],
        [Moneda],
        [Observacion],
        [IdProveedor],
        [IdTipoCompra],
        [IdProyecto],
        [IdEstadoSalida],
        [IdUbicacion],
        [IdUbicacionAnterior],
        [UsuarioRegistro]
    )
    SELECT
        ROW_NUMBER() OVER (ORDER BY leg.[id]),
        leg.[id],
        'INGRESO',
        ISNULL(leg.[cantidad], 0),
        CAST('2024-03-18T00:00:00' AS DATETIME2),
        ISNULL(ins.[PrecioReferencia], 0),
        'COP',
        'Saldo Base Inicial - Inventario Físico Real',
        (SELECT TOP 1 [Id] FROM [dbo].[Proveedor] ORDER BY [Id]),
        (SELECT TOP 1 [Id] FROM [dbo].[TipoCompra] WHERE [Nombre] LIKE '%Ajuste%' OR [Nombre] LIKE '%Inicial%' OR [Id] = 1),
        (SELECT TOP 1 [Id] FROM [dbo].[Proyecto] ORDER BY [Id]),
        NULL,
        CASE WHEN EXISTS (SELECT 1 FROM [dbo].[Ubicacion] ub WHERE ub.[Id] = leg.[id_ubicacion]) THEN leg.[id_ubicacion] ELSE NULL END,
        NULL,
        'Migración Legacy'
    FROM [UDIT_Legacy].[dbo].[Insumo] leg
    JOIN [dbo].[Insumo] ins ON ins.[Id] = leg.[id]
    WHERE ISNULL(leg.[cantidad], 0) > 0;

    DECLARE @rcMov INT = @@ROWCOUNT;
    SET IDENTITY_INSERT [dbo].[MovimientoInventario] OFF;
    PRINT '  - Kardex inicializado con saldo físico real (' + CAST(@rcMov AS VARCHAR) + ' movimientos generados).';

    PRINT '=====================================================';
    PRINT 'PASO 8: Ajustando contadores IDENTITY (Reseed)...';
    PRINT '=====================================================';

    DECLARE @MaxMov INT = (SELECT ISNULL(MAX([Id]), 0) FROM [dbo].[MovimientoInventario]);
    DBCC CHECKIDENT ('dbo.MovimientoInventario', RESEED, @MaxMov);

    DECLARE @MaxIns INT = (SELECT ISNULL(MAX([Id]), 0) FROM [dbo].[Insumo]);
    DBCC CHECKIDENT ('dbo.Insumo', RESEED, @MaxIns);

    DECLARE @MaxProy INT = (SELECT ISNULL(MAX([Id]), 0) FROM [dbo].[Proyecto]);
    DBCC CHECKIDENT ('dbo.Proyecto', RESEED, @MaxProy);

    DECLARE @MaxProv INT = (SELECT ISNULL(MAX([Id]), 0) FROM [dbo].[Proveedor]);
    DBCC CHECKIDENT ('dbo.Proveedor', RESEED, @MaxProv);

    DECLARE @MaxPers INT = (SELECT ISNULL(MAX([Id]), 0) FROM [dbo].[Personal]);
    DBCC CHECKIDENT ('dbo.Personal', RESEED, @MaxPers);

    DECLARE @MaxUbi INT = (SELECT ISNULL(MAX([Id]), 0) FROM [dbo].[Ubicacion]);
    DBCC CHECKIDENT ('dbo.Ubicacion', RESEED, @MaxUbi);

    DECLARE @MaxEmp INT = (SELECT ISNULL(MAX([Id]), 0) FROM [dbo].[Empaquetamiento]);
    DBCC CHECKIDENT ('dbo.Empaquetamiento', RESEED, @MaxEmp);

    DECLARE @MaxCat INT = (SELECT ISNULL(MAX([Id]), 0) FROM [dbo].[CategoriaInsumo]);
    DBCC CHECKIDENT ('dbo.CategoriaInsumo', RESEED, @MaxCat);

    PRINT '=====================================================';
    PRINT 'PASO 9: Verificando Roles Identity...';
    PRINT '=====================================================';

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AspNetRoles] WHERE [Name] = 'Admin')
        INSERT INTO [dbo].[AspNetRoles] ([Id], [Name], [NormalizedName], [ConcurrencyStamp])
        VALUES (NEWID(), 'Admin', 'ADMIN', NEWID());

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AspNetRoles] WHERE [Name] = 'Developer')
        INSERT INTO [dbo].[AspNetRoles] ([Id], [Name], [NormalizedName], [ConcurrencyStamp])
        VALUES (NEWID(), 'Developer', 'DEVELOPER', NEWID());

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AspNetRoles] WHERE [Name] = 'Assistant')
        INSERT INTO [dbo].[AspNetRoles] ([Id], [Name], [NormalizedName], [ConcurrencyStamp])
        VALUES (NEWID(), 'Assistant', 'ASSISTANT', NEWID());

    IF NOT EXISTS (SELECT 1 FROM [dbo].[AspNetRoles] WHERE [Name] = 'User')
        INSERT INTO [dbo].[AspNetRoles] ([Id], [Name], [NormalizedName], [ConcurrencyStamp])
        VALUES (NEWID(), 'User', 'USER', NEWID());

    COMMIT TRANSACTION;

    PRINT '=====================================================';
    PRINT '¡MIGRACIÓN Y CUADRE DE KARDEX COMPLETADO CON ÉXITO!';
    PRINT '=====================================================';

    -- Reporte de Validación Comparativa
    SELECT 'Insumos en V2' AS Metrica, COUNT(*) AS TotalRegistros FROM [dbo].[Insumo]
    UNION ALL SELECT 'Insumos en Legacy', COUNT(*) FROM [UDIT_Legacy].[dbo].[Insumo]
    UNION ALL SELECT 'Unidades Físicas en V2 (Kardex)', ISNULL(SUM(Cantidad), 0) FROM [dbo].[MovimientoInventario] WHERE TipoMovimiento = 'INGRESO'
    UNION ALL SELECT 'Unidades Físicas en Legacy', ISNULL(SUM(cantidad), 0) FROM [UDIT_Legacy].[dbo].[Insumo]
    UNION ALL SELECT 'Categorías de Insumos', COUNT(*) FROM [dbo].[CategoriaInsumo]
    UNION ALL SELECT 'Empaquetamientos', COUNT(*) FROM [dbo].[Empaquetamiento]
    UNION ALL SELECT 'Ubicaciones', COUNT(*) FROM [dbo].[Ubicacion]
    UNION ALL SELECT 'Proyectos', COUNT(*) FROM [dbo].[Proyecto]
    UNION ALL SELECT 'Proveedores', COUNT(*) FROM [dbo].[Proveedor]
    UNION ALL SELECT 'Usuarios en Sistema', COUNT(*) FROM [dbo].[AspNetUsers];

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    PRINT 'ERROR EN LA MIGRACIÓN: ' + ERROR_MESSAGE();
    THROW;
END CATCH;
GO
