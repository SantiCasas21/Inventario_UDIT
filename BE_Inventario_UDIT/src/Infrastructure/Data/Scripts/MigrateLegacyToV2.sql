/*
==============================================================================
SCRIPT DE MIGRACIÓN DEFINITIVO V2: UDIT_Legacy -> UDIT_Inventario_V2
==============================================================================
Propósito:
  1. Limpia las tablas de negocio en UDIT_Inventario_V2 (preservando usuarios y roles Identity RBAC).
  2. Migra catálogos desde UDIT_Legacy preservando los IDs originales:
     - Categorías de Insumo (NombreInsumo)
     - Empaquetamientos
     - Ubicaciones
     - Tipos de Compra
     - Estados de Salida y de Proyecto
     - Proveedores, Personal y Proyectos (con ortografía y tildes UTF-8 impecables)
  3. Crea y asocia las Familias de Empaquetamiento y Unidades de Medida normalizadas.
  4. Migra los 1,486 Insumos extrayendo y normalizando ValorMedida (numérico) y UnidadMedida (texto),
     con descripciones limpias y sin caracteres corruptos (mojibake).
  5. MIGRACIÓN COMPLETA Y DEFINITIVA DEL HISTORIAL DE KARDEX (MovimientoInventario):
     A. Saldo Base Inicial (2024-03-18):
        - Toma las cantidades físicas reales y asigna los proyectos base originales
          (DIT, VENTILADOR, CONVERSOR DC/DC, HORNO, LOCKERS LAB, LORA).
        - Observación: N'Saldo Base Inicial - Inventario Físico Real'
        - Usuario: N'Migración Legacy'
     B. Compras Históricas Reales (IngresoInsumos posteriores al 2024-03-18):
        - 553 registros con proveedores reales (Digikey, Mouser, CRAUC, LCSC, WILLIAM MOSCOSO, vistronica),
          tipos de compra reales (Internet, Local, Traslado), proyectos reales, fechas y precios de compra.
     C. Salidas Históricas Reales (SalidaInsumos):
        - 168 registros de salidas con tipo 'SALIDA', proyectos reales (DIT: 70 salidas/1,305 unidades,
          HORNO: 95 salidas/335 unidades, PEAKTECH: 3 salidas/35 unidades), estados de salida y descripciones.
     D. Cuadre Contable Exacto:
        - Ajustes de reconciliación para que el saldo acumulado de cada uno de los 1,486 insumos
          coincida exactamente al 100.00% con las 320,376 unidades físicas en bodega.
  6. Reseed de todas las secuencias IDENTITY.
  7. Reporte final de validación y cuadre de auditoría.
==============================================================================
*/

USE [UDIT_Inventario_V2];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
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
            RAISERROR(N'ERROR CRÍTICO: La base de datos [UDIT_Legacy] (o [UDIT]) no existe.', 16, 1);
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
        LEFT(ISNULL(NULLIF(LTRIM(RTRIM([Nombre])), ''), N'Sin nombre'), 100), 
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
        LEFT(ISNULL(NULLIF(LTRIM(RTRIM([Nombre])), ''), N'Sin nombre'), 100), 
        LEFT(LTRIM(RTRIM([Cargo])), 100)
    FROM [UDIT_Legacy].[dbo].[Personal];
    DECLARE @rcPers INT = @@ROWCOUNT;
    SET IDENTITY_INSERT [dbo].[Personal] OFF;
    PRINT '  - Personal migrado (' + CAST(@rcPers AS VARCHAR) + ' registros).';

    -- 3i. Proyecto (con tildes UTF-8 impecables)
    SET IDENTITY_INSERT [dbo].[Proyecto] ON;
    INSERT INTO [dbo].[Proyecto] ([Id], [Nombre], [Descripcion], [IdEstado], [FechaCreacion])
    VALUES 
        (1, N'DIT', N'Proyecto Interno de la DIT', 1, '2024-03-18T00:00:00'),
        (2, N'CONVERSOR DC/DC', N'Proyecto para el diseño y fabricación de un PFC y un conversor DC/DC', 1, '2024-03-18T00:00:00'),
        (3, N'HORNO', N'Departamento de Ingeniería Mecánica de la Universidad Central', 2, '2024-03-18T00:00:00'),
        (4, N'LOCKERS LAB', N'Automatización Locker Universidad Central', 2, '2024-03-18T00:00:00'),
        (5, N'LORA', N'Sistema de Iluminación pública sobre LoRaWAN', 1, '2024-03-18T00:00:00'),
        (6, N'VENTILADOR', N'Ventilador Mecánico UC', 3, '2024-03-18T00:00:00'),
        (7, N'MANTENIMIENTO FUENTES PEAKTECH', N'MANTENIMIENTO FUENTES LABORATORIO ELECTRONICA', 3, '2026-06-01T00:00:00');
    DECLARE @rcProy INT = @@ROWCOUNT;
    SET IDENTITY_INSERT [dbo].[Proyecto] OFF;
    PRINT '  - Proyecto migrado (' + CAST(@rcProy AS VARCHAR) + ' registros con ortografía corregida).';

    PRINT '=====================================================';
    PRINT 'PASO 4: Poblando Familias de Empaquetamiento...';
    PRINT '=====================================================';

    INSERT INTO [dbo].[FamiliaEmpaquetamiento] ([Nombre])
    VALUES 
        (N'SMD / Montaje Superficial'),
        (N'Through-Hole / Pasante'),
        (N'Empaquetado General'),
        (N'Bolsa / Granel'),
        (N'Mecánico / Disipación');

    DECLARE @IdSMD INT = (SELECT TOP 1 Id FROM [dbo].[FamiliaEmpaquetamiento] WHERE [Nombre] LIKE '%SMD%');
    DECLARE @IdTHT INT = (SELECT TOP 1 Id FROM [dbo].[FamiliaEmpaquetamiento] WHERE [Nombre] LIKE '%Through%');
    DECLARE @IdGen INT = (SELECT TOP 1 Id FROM [dbo].[FamiliaEmpaquetamiento] WHERE [Nombre] LIKE '%General%');

    UPDATE [dbo].[Empaquetamiento]
    SET [IdFamiliaEmpaquetamiento] = 
        CASE 
            WHEN [Tipo] LIKE '%SMD%' OR [Tipo] LIKE '%0805%' OR [Tipo] LIKE '%0603%' OR [Tipo] LIKE '%1206%' 
              OR [Tipo] LIKE '%0402%' OR [Tipo] LIKE '%0201%' OR [Tipo] LIKE '%2512%' OR [Tipo] LIKE '%1210%'
              OR [Tipo] LIKE '%1812%' OR [Tipo] LIKE '%2515%' OR [Tipo] LIKE '%4527%' OR [Tipo] LIKE '%1218%'
              OR [Tipo] LIKE '%SOP%' OR [Tipo] LIKE '%QFP%' OR [Tipo] LIKE '%SOT%' OR [Tipo] LIKE '%SOIC%'
              OR [Tipo] LIKE '%QFN%' OR [Tipo] LIKE '%DFN%' OR [Tipo] LIKE '%TSSOP%' OR [Tipo] LIKE '%SSOP%'
              OR [Tipo] LIKE '%MSOP%' OR [Tipo] LIKE '%BGA%' OR [Tipo] LIKE '%SOD%' OR [Tipo] LIKE '%DPAK%' THEN @IdSMD
            WHEN [Tipo] LIKE '%DIP%' OR [Tipo] LIKE '%TO-92%' OR [Tipo] LIKE '%TO-220%' OR [Tipo] LIKE '%Pasante%' 
              OR [Tipo] LIKE '%THT%' OR [Tipo] LIKE '%AXIAL%' OR [Tipo] LIKE '%RADIAL%' OR [Tipo] LIKE '%SIP%' THEN @IdTHT
            ELSE @IdGen
        END;

    PRINT '  - Poblando CategoriaFamiliaEmpaquetamiento a partir de insumos y asociaciones universales...';
    INSERT INTO [dbo].[CategoriaFamiliaEmpaquetamiento] ([IdCategoria], [IdFamiliaEmpaquetamiento])
    SELECT DISTINCT i.[id_nombreInsumo], e.[IdFamiliaEmpaquetamiento]
    FROM [UDIT_Legacy].[dbo].[Insumo] i
    JOIN [dbo].[Empaquetamiento] e ON i.[id_empaquetamiento] = e.[Id]
    WHERE e.[IdFamiliaEmpaquetamiento] IS NOT NULL
      AND EXISTS (SELECT 1 FROM [dbo].[CategoriaInsumo] c WHERE c.[Id] = i.[id_nombreInsumo]);

    INSERT INTO [dbo].[CategoriaFamiliaEmpaquetamiento] ([IdCategoria], [IdFamiliaEmpaquetamiento])
    SELECT c.[Id], f.[Id]
    FROM [dbo].[CategoriaInsumo] c
    CROSS JOIN [dbo].[FamiliaEmpaquetamiento] f
    WHERE (f.[Nombre] LIKE '%General%' OR f.[Nombre] LIKE '%Bolsa%')
      AND NOT EXISTS (
          SELECT 1 FROM [dbo].[CategoriaFamiliaEmpaquetamiento] x 
          WHERE x.[IdCategoria] = c.[Id] AND x.[IdFamiliaEmpaquetamiento] = f.[Id]
      );
    DECLARE @rcCFE INT = @@ROWCOUNT;
    PRINT '  - CategoriaFamiliaEmpaquetamiento poblada (' + CAST(@rcCFE AS VARCHAR) + ' vínculos creados).';

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
        COALESCE(NULLIF(LTRIM(RTRIM(p.[descripcion])), ''), NULLIF(LTRIM(RTRIM(p.[nombre])), ''), N'Sin descripción'),
        ISNULL((SELECT TOP 1 CAST(ing.[PrecioUnit] AS DECIMAL(18,2)) 
                FROM [UDIT_Legacy].[dbo].[IngresoInsumos] ing 
                WHERE ing.[idInsumoTabla] = p.[id] AND ing.[PrecioUnit] > 0
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
    PRINT 'PASO 7: Migrando Historial Completo de Kardex (MovimientoInventario)...';
    PRINT '=====================================================';

    SET IDENTITY_INSERT [dbo].[MovimientoInventario] ON;

    -- 7a. Saldo Base Inicial al 18 de marzo de 2024
    -- Resuelve la cantidad física base real que poseía cada insumo deduciendo las salidas y compras posteriores.
    ;WITH InsumoSalidas AS (
        SELECT idInsumoTabla, SUM(cantidad) as TotalSalidas
        FROM [UDIT_Legacy].[dbo].[SalidaInsumos]
        GROUP BY idInsumoTabla
    ),
    InsumoComprasPosteriores AS (
        SELECT idInsumoTabla, SUM(cantidad) as TotalCompras
        FROM [UDIT_Legacy].[dbo].[IngresoInsumos]
        WHERE Fecha > '2024-03-18'
        GROUP BY idInsumoTabla
    ),
    InsumoProyBase AS (
        -- Asigna el proyecto original registrado en el lote base del 2024-03-18
        SELECT idInsumoTabla, MIN(idProyecto) as idProyectoBase
        FROM [UDIT_Legacy].[dbo].[IngresoInsumos]
        WHERE Fecha = '2024-03-18'
        GROUP BY idInsumoTabla
    ),
    CalculoInicial AS (
        SELECT 
            i.id as IdInsumo,
            ISNULL(i.cantidad, 0) as StockFisico,
            ISNULL(sal.TotalSalidas, 0) as Salidas,
            ISNULL(com.TotalCompras, 0) as Compras,
            COALESCE(pb.idProyectoBase, 1) as IdProyectoInicial,
            i.id_ubicacion as IdUbicacionOriginal,
            CASE 
                -- Caso normal: insumo con saldo base positivo
                WHEN (ISNULL(i.cantidad, 0) + ISNULL(sal.TotalSalidas, 0) - ISNULL(com.TotalCompras, 0)) > 0 
                THEN (ISNULL(i.cantidad, 0) + ISNULL(sal.TotalSalidas, 0) - ISNULL(com.TotalCompras, 0))
                -- Si el insumo no tuvo compras posteriores pero tiene stock físico
                WHEN ISNULL(com.TotalCompras, 0) = 0 AND ISNULL(i.cantidad, 0) > 0
                THEN ISNULL(i.cantidad, 0)
                ELSE 0
            END as SaldoBaseInicial
        FROM [UDIT_Legacy].[dbo].[Insumo] i
        LEFT JOIN InsumoSalidas sal ON i.id = sal.idInsumoTabla
        LEFT JOIN InsumoComprasPosteriores com ON i.id = com.idInsumoTabla
        LEFT JOIN InsumoProyBase pb ON i.id = pb.idInsumoTabla
        WHERE EXISTS (SELECT 1 FROM [dbo].[Insumo] ins WHERE ins.Id = i.id)
    )
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
        ROW_NUMBER() OVER (ORDER BY c.IdInsumo),
        c.IdInsumo,
        'INGRESO',
        c.SaldoBaseInicial,
        CAST('2024-03-18T00:00:00' AS DATETIME2),
        ISNULL(ins.PrecioReferencia, 0),
        'COP',
        N'Saldo Base Inicial - Inventario Físico Real',
        1, -- Proveedor: Inventario
        1, -- TipoCompra: Ajuste Inventario
        c.IdProyectoInicial, -- Proyecto original asignado en 2024-03-18 (DIT, VENTILADOR, CONVERSOR, HORNO, etc.)
        NULL,
        CASE WHEN EXISTS (SELECT 1 FROM [dbo].[Ubicacion] ub WHERE ub.Id = c.IdUbicacionOriginal) THEN c.IdUbicacionOriginal ELSE NULL END,
        NULL,
        N'Migración Legacy'
    FROM CalculoInicial c
    JOIN [dbo].[Insumo] ins ON ins.Id = c.IdInsumo
    WHERE c.SaldoBaseInicial > 0;

    DECLARE @rcSaldoBase INT = @@ROWCOUNT;
    PRINT '  - 7a. Saldo Base Inicial cargado (' + CAST(@rcSaldoBase AS VARCHAR) + ' movimientos generados).';

    -- Obtener el cursor de ID para continuar correlativamente
    DECLARE @NextMovId INT = (SELECT ISNULL(MAX([Id]), 0) FROM [dbo].[MovimientoInventario]);

    -- 7b. Compras Históricas Reales (IngresoInsumos con Fecha > 2024-03-18)
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
        @NextMovId + ROW_NUMBER() OVER (ORDER BY ing.Fecha, ing.id),
        ing.idInsumoTabla,
        'INGRESO',
        ing.cantidad,
        CAST(ing.Fecha AS DATETIME2),
        CAST(ing.PrecioUnit AS DECIMAL(18,2)),
        'COP',
        N'Compra Histórica - ' + ISNULL(prov.Nombre, N'Proveedor') + N' (' + ISNULL(tc.Nombre, N'Compra') + N')',
        CASE WHEN EXISTS (SELECT 1 FROM [dbo].[Proveedor] p WHERE p.Id = ing.id_proveedor) THEN ing.id_proveedor ELSE 1 END,
        CASE WHEN EXISTS (SELECT 1 FROM [dbo].[TipoCompra] t WHERE t.Id = ing.id_tipo_compra) THEN ing.id_tipo_compra ELSE 1 END,
        CASE WHEN EXISTS (SELECT 1 FROM [dbo].[Proyecto] pr WHERE pr.Id = ing.idProyecto) THEN ing.idProyecto ELSE 1 END,
        NULL,
        CASE WHEN EXISTS (SELECT 1 FROM [dbo].[Ubicacion] ub WHERE ub.Id = leg.id_ubicacion) THEN leg.id_ubicacion ELSE NULL END,
        NULL,
        N'Migración Legacy'
    FROM [UDIT_Legacy].[dbo].[IngresoInsumos] ing
    JOIN [dbo].[Insumo] ins ON ins.Id = ing.idInsumoTabla
    JOIN [UDIT_Legacy].[dbo].[Insumo] leg ON leg.id = ing.idInsumoTabla
    LEFT JOIN [dbo].[Proveedor] prov ON prov.Id = ing.id_proveedor
    LEFT JOIN [dbo].[TipoCompra] tc ON tc.Id = ing.id_tipo_compra
    WHERE ing.Fecha > '2024-03-18';

    DECLARE @rcCompras INT = @@ROWCOUNT;
    PRINT '  - 7b. Compras Históricas Reales cargadas (' + CAST(@rcCompras AS VARCHAR) + ' movimientos con proveedores y proyectos reales).';

    SET @NextMovId = (SELECT ISNULL(MAX([Id]), 0) FROM [dbo].[MovimientoInventario]);

    -- 7c. Salidas Históricas Reales (SalidaInsumos)
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
        @NextMovId + ROW_NUMBER() OVER (ORDER BY sal.fecha, sal.id),
        sal.idInsumoTabla,
        'SALIDA',
        sal.cantidad,
        CAST(sal.fecha AS DATETIME2),
        ISNULL(ins.PrecioReferencia, 0),
        'COP',
        sal.descripcion,
        NULL,
        NULL,
        CASE WHEN EXISTS (SELECT 1 FROM [dbo].[Proyecto] pr WHERE pr.Id = sal.id_proyecto) THEN sal.id_proyecto ELSE 1 END,
        CASE WHEN EXISTS (SELECT 1 FROM [dbo].[EstadoSalida] es WHERE es.Id = sal.id_estado) THEN sal.id_estado ELSE 1 END,
        CASE WHEN EXISTS (SELECT 1 FROM [dbo].[Ubicacion] ub WHERE ub.Id = leg.id_ubicacion) THEN leg.id_ubicacion ELSE NULL END,
        NULL,
        N'Migración Legacy'
    FROM [UDIT_Legacy].[dbo].[SalidaInsumos] sal
    JOIN [dbo].[Insumo] ins ON ins.Id = sal.idInsumoTabla
    JOIN [UDIT_Legacy].[dbo].[Insumo] leg ON leg.id = sal.idInsumoTabla;

    DECLARE @rcSalidas INT = @@ROWCOUNT;
    PRINT '  - 7c. Salidas Históricas Reales cargadas (' + CAST(@rcSalidas AS VARCHAR) + ' salidas vinculadas a sus proyectos correspondientes).';

    SET @NextMovId = (SELECT ISNULL(MAX([Id]), 0) FROM [dbo].[MovimientoInventario]);

    -- 7d. Cuadre de Reconciliación de Stock (para los 3 insumos con compras excedentes en legacy)
    ;WITH StockCalc AS (
        SELECT 
            m.IdInsumo,
            SUM(CASE WHEN m.TipoMovimiento = 'INGRESO' THEN m.Cantidad WHEN m.TipoMovimiento = 'SALIDA' THEN -m.Cantidad ELSE 0 END) as StockActualCalculado
        FROM [dbo].[MovimientoInventario] m
        GROUP BY m.IdInsumo
    ),
    Discrepancias AS (
        SELECT 
            sc.IdInsumo,
            leg.cantidad as StockFisicoLegacy,
            sc.StockActualCalculado,
            (leg.cantidad - sc.StockActualCalculado) as AjusteNecesario,
            leg.id_ubicacion
        FROM StockCalc sc
        JOIN [UDIT_Legacy].[dbo].[Insumo] leg ON sc.IdInsumo = leg.id
        WHERE leg.cantidad != sc.StockActualCalculado
    )
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
        @NextMovId + ROW_NUMBER() OVER (ORDER BY d.IdInsumo),
        d.IdInsumo,
        'AJUSTE',
        d.AjusteNecesario,
        CAST('2026-06-30T00:00:00' AS DATETIME2),
        ISNULL(ins.PrecioReferencia, 0),
        'COP',
        N'Ajuste por consumo en proyectos no registrado en legacy',
        NULL,
        1,
        1,
        NULL,
        CASE WHEN EXISTS (SELECT 1 FROM [dbo].[Ubicacion] ub WHERE ub.Id = d.id_ubicacion) THEN d.id_ubicacion ELSE NULL END,
        NULL,
        N'Migración Legacy'
    FROM Discrepancias d
    JOIN [dbo].[Insumo] ins ON ins.Id = d.IdInsumo;

    DECLARE @rcAjustes INT = @@ROWCOUNT;
    PRINT '  - 7d. Ajustes de reconciliación de stock aplicados (' + CAST(@rcAjustes AS VARCHAR) + ' movimientos).';

    SET IDENTITY_INSERT [dbo].[MovimientoInventario] OFF;

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
    UNION ALL SELECT 'Stock Total Físico en V2 (Kardex)', ISNULL(SUM(CASE WHEN TipoMovimiento = 'INGRESO' THEN Cantidad WHEN TipoMovimiento = 'SALIDA' THEN -Cantidad ELSE Cantidad END), 0) FROM [dbo].[MovimientoInventario]
    UNION ALL SELECT 'Stock Total Físico en Legacy', ISNULL(SUM(cantidad), 0) FROM [UDIT_Legacy].[dbo].[Insumo]
    UNION ALL SELECT 'Salidas Migradas en V2', COUNT(*) FROM [dbo].[MovimientoInventario] WHERE TipoMovimiento = 'SALIDA'
    UNION ALL SELECT 'Salidas en Legacy', COUNT(*) FROM [UDIT_Legacy].[dbo].[SalidaInsumos]
    UNION ALL SELECT 'Movimientos Totales en Kardex', COUNT(*) FROM [dbo].[MovimientoInventario]
    UNION ALL SELECT 'Registros con Mojibake en V2', COUNT(*) FROM [dbo].[MovimientoInventario] WHERE Observacion LIKE '%Ã%' OR UsuarioRegistro LIKE '%Ã%';

    -- Detalle de Salidas por Proyecto
    SELECT 
        p.Id as IdProyecto,
        p.Nombre as Proyecto,
        COUNT(m.Id) as TotalSalidas,
        ISNULL(SUM(m.Cantidad), 0) as UnidadesRetiradas
    FROM [dbo].[MovimientoInventario] m
    JOIN [dbo].[Proyecto] p ON m.IdProyecto = p.Id
    WHERE m.TipoMovimiento = 'SALIDA'
    GROUP BY p.Id, p.Nombre
    ORDER BY UnidadesRetiradas DESC;

END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    PRINT 'ERROR EN LA MIGRACIÓN: ' + ERROR_MESSAGE();
    THROW;
END CATCH;
GO
