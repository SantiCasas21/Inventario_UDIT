/*
  Migra datos de UDIT_Legacy (restaurada desde UDIT.bak) hacia UDIT_Inventario_V2.
  Ejecutar DESPUÉS de restaurar el .bak como UDIT_Legacy.
  Preserva IDs originales para mantener relaciones.
  No toca tablas AspNet* (usuarios del sistema nuevo).
*/

USE UDIT_Inventario_V2;
GO

SET NOCOUNT ON;
BEGIN TRANSACTION;

BEGIN TRY
    -- Limpiar datos de negocio (mantener usuarios Identity)
    DELETE FROM MovimientoInventario;
    DELETE FROM Insumo;
    DELETE FROM Proyecto;
    DELETE FROM Personal;
    DELETE FROM Proveedor;
    DELETE FROM CategoriaInsumo;
    DELETE FROM Empaquetamiento;
    DELETE FROM Ubicacion;
    DELETE FROM TipoCompra;
    DELETE FROM EstadoSalida;
    DELETE FROM EstadoProyecto;

    -- Catálogos
    SET IDENTITY_INSERT CategoriaInsumo ON;
    INSERT INTO CategoriaInsumo (Id, Nombre)
    SELECT id, LEFT(nombreInsumo, 100)
    FROM UDIT_Legacy.dbo.NombreInsumo;
    SET IDENTITY_INSERT CategoriaInsumo OFF;

    SET IDENTITY_INSERT Empaquetamiento ON;
    INSERT INTO Empaquetamiento (Id, Tipo)
    SELECT id, LEFT(tipo, 50)
    FROM UDIT_Legacy.dbo.Empaquetamiento;
    SET IDENTITY_INSERT Empaquetamiento OFF;

    SET IDENTITY_INSERT EstadoProyecto ON;
    INSERT INTO EstadoProyecto (Id, Estado)
    SELECT id, LEFT(estado, 50)
    FROM UDIT_Legacy.dbo.EstadoProyectos;
    SET IDENTITY_INSERT EstadoProyecto OFF;

    SET IDENTITY_INSERT EstadoSalida ON;
    INSERT INTO EstadoSalida (Id, Nombre)
    SELECT id, LEFT(nombre, 50)
    FROM UDIT_Legacy.dbo.EstadosSalidas;
    SET IDENTITY_INSERT EstadoSalida OFF;

    SET IDENTITY_INSERT Ubicacion ON;
    INSERT INTO Ubicacion (Id, Nombre)
    SELECT id, LEFT(ubicacion, 100)
    FROM UDIT_Legacy.dbo.Ubicacion;
    SET IDENTITY_INSERT Ubicacion OFF;

    SET IDENTITY_INSERT TipoCompra ON;
    INSERT INTO TipoCompra (Id, Nombre)
    SELECT id, LEFT(nombre, 50)
    FROM UDIT_Legacy.dbo.TipoCompra;
    SET IDENTITY_INSERT TipoCompra OFF;

    SET IDENTITY_INSERT Proveedor ON;
    INSERT INTO Proveedor (Id, Nombre, Contacto, Direccion)
    SELECT Id, LEFT(ISNULL(Nombre, 'Sin nombre'), 100), Contacto, Direccion
    FROM UDIT_Legacy.dbo.Proveedor;
    SET IDENTITY_INSERT Proveedor OFF;

    SET IDENTITY_INSERT Personal ON;
    INSERT INTO Personal (Id, Nombre, Cargo)
    SELECT Id, LEFT(ISNULL(Nombre, 'Sin nombre'), 100), Cargo
    FROM UDIT_Legacy.dbo.Personal;
    SET IDENTITY_INSERT Personal OFF;

    SET IDENTITY_INSERT Proyecto ON;
    INSERT INTO Proyecto (Id, Nombre, Descripcion, IdEstado, FechaCreacion)
    SELECT
        Id,
        LEFT(ISNULL(Nombre, 'Sin nombre'), 100),
        Descripcion,
        idEstado,
        ISNULL(FechaCreacion, GETDATE())
    FROM UDIT_Legacy.dbo.Proyectos;
    SET IDENTITY_INSERT Proyecto OFF;

    -- Insumos
    SET IDENTITY_INSERT Insumo ON;
    INSERT INTO Insumo (Id, IdCategoria, CodigoFabrica, IdEmpaquetamiento, IdUbicacion, Descripcion, PrecioReferencia)
    SELECT
        i.id,
        i.id_nombreInsumo,
        LEFT(i.cod_fabrica, 100),
        i.id_empaquetamiento,
        i.id_ubicacion,
        COALESCE(NULLIF(LTRIM(RTRIM(i.descripcion)), ''), NULLIF(LTRIM(RTRIM(i.nombre)), '')),
        TRY_CAST(
            LEFT(
                LTRIM(RTRIM(i.valor)),
                PATINDEX('%[^0-9.]%', LTRIM(RTRIM(i.valor)) + 'X') - 1
            ) AS decimal(18, 2)
        )
    FROM UDIT_Legacy.dbo.Insumo i
    WHERE EXISTS (SELECT 1 FROM UDIT_Legacy.dbo.NombreInsumo n WHERE n.id = i.id_nombreInsumo);
    SET IDENTITY_INSERT Insumo OFF;

    -- Movimientos: ingresos
    SET IDENTITY_INSERT MovimientoInventario ON;
    INSERT INTO MovimientoInventario (
        Id, IdInsumo, TipoMovimiento, Cantidad, Fecha, PrecioUnitario,
        Observacion, IdProveedor, IdTipoCompra, IdProyecto, IdEstadoSalida
    )
    SELECT
        ing.id,
        COALESCE(ing.idInsumoTabla, ing.id_insumo),
        'INGRESO',
        ing.cantidad,
        CAST(ing.Fecha AS datetime2),
        CAST(ing.PrecioUnit AS decimal(18, 2)),
        NULL,
        ing.id_proveedor,
        ing.id_tipo_compra,
        ing.idProyecto,
        NULL
    FROM UDIT_Legacy.dbo.IngresoInsumos ing
    WHERE COALESCE(ing.idInsumoTabla, ing.id_insumo) IN (SELECT Id FROM Insumo);

    -- Movimientos: salidas (IDs desplazados para no chocar con ingresos)
    INSERT INTO MovimientoInventario (
        Id, IdInsumo, TipoMovimiento, Cantidad, Fecha, PrecioUnitario,
        Observacion, IdProveedor, IdTipoCompra, IdProyecto, IdEstadoSalida
    )
    SELECT
        sal.id + 100000,
        COALESCE(sal.idInsumoTabla, sal.id_insumo),
        'SALIDA',
        ISNULL(sal.cantidad, 0),
        CAST(sal.fecha AS datetime2),
        NULL,
        LEFT(sal.descripcion, 255),
        NULL,
        NULL,
        sal.id_proyecto,
        sal.id_estado
    FROM UDIT_Legacy.dbo.SalidaInsumos sal
    WHERE COALESCE(sal.idInsumoTabla, sal.id_insumo) IN (SELECT Id FROM Insumo);

    SET IDENTITY_INSERT MovimientoInventario OFF;

    COMMIT TRANSACTION;

    SELECT 'Migración completada' AS Resultado;
    SELECT 'Insumo' AS Tabla, COUNT(*) AS Filas FROM Insumo
    UNION ALL SELECT 'MovimientoInventario', COUNT(*) FROM MovimientoInventario
    UNION ALL SELECT 'Proyecto', COUNT(*) FROM Proyecto
    UNION ALL SELECT 'CategoriaInsumo', COUNT(*) FROM CategoriaInsumo;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO
