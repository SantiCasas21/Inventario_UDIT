IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'UDIT_Inventario_V2')
BEGIN
    CREATE DATABASE [UDIT_Inventario_V2];
END;
GO
USE [UDIT_Inventario_V2];
GO

﻿IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260715204256_InitialCreate'
)
BEGIN
    CREATE TABLE [CategoriaInsumo] (
        [Id] int NOT NULL IDENTITY,
        [Nombre] nvarchar(100) NOT NULL,
        CONSTRAINT [PK_CategoriaInsumo] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260715204256_InitialCreate'
)
BEGIN
    CREATE TABLE [Empaquetamiento] (
        [Id] int NOT NULL IDENTITY,
        [Tipo] nvarchar(50) NOT NULL,
        CONSTRAINT [PK_Empaquetamiento] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260715204256_InitialCreate'
)
BEGIN
    CREATE TABLE [EstadoProyecto] (
        [Id] int NOT NULL IDENTITY,
        [Estado] nvarchar(50) NOT NULL,
        CONSTRAINT [PK_EstadoProyecto] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260715204256_InitialCreate'
)
BEGIN
    CREATE TABLE [EstadoSalida] (
        [Id] int NOT NULL IDENTITY,
        [Nombre] nvarchar(50) NOT NULL,
        CONSTRAINT [PK_EstadoSalida] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260715204256_InitialCreate'
)
BEGIN
    CREATE TABLE [Personal] (
        [Id] int NOT NULL IDENTITY,
        [Nombre] nvarchar(100) NOT NULL,
        [Cargo] nvarchar(100) NULL,
        CONSTRAINT [PK_Personal] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260715204256_InitialCreate'
)
BEGIN
    CREATE TABLE [Proveedor] (
        [Id] int NOT NULL IDENTITY,
        [Nombre] nvarchar(100) NOT NULL,
        [Contacto] nvarchar(100) NULL,
        [Direccion] nvarchar(255) NULL,
        CONSTRAINT [PK_Proveedor] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260715204256_InitialCreate'
)
BEGIN
    CREATE TABLE [TipoCompra] (
        [Id] int NOT NULL IDENTITY,
        [Nombre] nvarchar(50) NOT NULL,
        CONSTRAINT [PK_TipoCompra] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260715204256_InitialCreate'
)
BEGIN
    CREATE TABLE [Ubicacion] (
        [Id] int NOT NULL IDENTITY,
        [Nombre] nvarchar(100) NOT NULL,
        CONSTRAINT [PK_Ubicacion] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260715204256_InitialCreate'
)
BEGIN
    CREATE TABLE [Proyecto] (
        [Id] int NOT NULL IDENTITY,
        [Nombre] nvarchar(100) NOT NULL,
        [Descripcion] nvarchar(255) NULL,
        [IdEstado] int NOT NULL,
        [FechaCreacion] datetime2 NOT NULL DEFAULT (GETDATE()),
        CONSTRAINT [PK_Proyecto] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Proyecto_EstadoProyecto_IdEstado] FOREIGN KEY ([IdEstado]) REFERENCES [EstadoProyecto] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260715204256_InitialCreate'
)
BEGIN
    CREATE TABLE [Insumo] (
        [Id] int NOT NULL IDENTITY,
        [IdCategoria] int NOT NULL,
        [CodigoFabrica] nvarchar(100) NOT NULL,
        [IdEmpaquetamiento] int NOT NULL,
        [IdUbicacion] int NOT NULL,
        [Descripcion] varchar(max) NULL,
        [PrecioReferencia] decimal(18,2) NULL,
        CONSTRAINT [PK_Insumo] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Insumo_CategoriaInsumo_IdCategoria] FOREIGN KEY ([IdCategoria]) REFERENCES [CategoriaInsumo] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Insumo_Empaquetamiento_IdEmpaquetamiento] FOREIGN KEY ([IdEmpaquetamiento]) REFERENCES [Empaquetamiento] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_Insumo_Ubicacion_IdUbicacion] FOREIGN KEY ([IdUbicacion]) REFERENCES [Ubicacion] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260715204256_InitialCreate'
)
BEGIN
    CREATE TABLE [MovimientoInventario] (
        [Id] int NOT NULL IDENTITY,
        [IdInsumo] int NOT NULL,
        [TipoMovimiento] nvarchar(10) NOT NULL,
        [Cantidad] int NOT NULL,
        [Fecha] datetime2 NOT NULL DEFAULT (GETDATE()),
        [PrecioUnitario] decimal(18,2) NULL,
        [Observacion] nvarchar(255) NULL,
        [IdProveedor] int NULL,
        [IdTipoCompra] int NULL,
        [IdProyecto] int NULL,
        [IdEstadoSalida] int NULL,
        CONSTRAINT [PK_MovimientoInventario] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_MovimientoInventario_EstadoSalida_IdEstadoSalida] FOREIGN KEY ([IdEstadoSalida]) REFERENCES [EstadoSalida] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_MovimientoInventario_Insumo_IdInsumo] FOREIGN KEY ([IdInsumo]) REFERENCES [Insumo] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_MovimientoInventario_Proveedor_IdProveedor] FOREIGN KEY ([IdProveedor]) REFERENCES [Proveedor] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_MovimientoInventario_Proyecto_IdProyecto] FOREIGN KEY ([IdProyecto]) REFERENCES [Proyecto] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_MovimientoInventario_TipoCompra_IdTipoCompra] FOREIGN KEY ([IdTipoCompra]) REFERENCES [TipoCompra] ([Id]) ON DELETE SET NULL
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260715204256_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Insumo_IdCategoria] ON [Insumo] ([IdCategoria]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260715204256_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Insumo_IdEmpaquetamiento] ON [Insumo] ([IdEmpaquetamiento]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260715204256_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Insumo_IdUbicacion] ON [Insumo] ([IdUbicacion]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260715204256_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_MovimientoInventario_IdEstadoSalida] ON [MovimientoInventario] ([IdEstadoSalida]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260715204256_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_MovimientoInventario_IdInsumo] ON [MovimientoInventario] ([IdInsumo]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260715204256_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_MovimientoInventario_IdProveedor] ON [MovimientoInventario] ([IdProveedor]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260715204256_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_MovimientoInventario_IdProyecto] ON [MovimientoInventario] ([IdProyecto]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260715204256_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_MovimientoInventario_IdTipoCompra] ON [MovimientoInventario] ([IdTipoCompra]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260715204256_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Proyecto_IdEstado] ON [Proyecto] ([IdEstado]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260715204256_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260715204256_InitialCreate', N'9.0.2');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260716190324_AddIdentityAndIndexes'
)
BEGIN
    CREATE TABLE [AspNetRoles] (
        [Id] nvarchar(450) NOT NULL,
        [Name] nvarchar(256) NULL,
        [NormalizedName] nvarchar(256) NULL,
        [ConcurrencyStamp] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetRoles] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260716190324_AddIdentityAndIndexes'
)
BEGIN
    CREATE TABLE [AspNetUsers] (
        [Id] nvarchar(450) NOT NULL,
        [NombreCompleto] nvarchar(max) NOT NULL,
        [FechaCreacion] datetime2 NOT NULL,
        [Activo] bit NOT NULL,
        [UserName] nvarchar(256) NULL,
        [NormalizedUserName] nvarchar(256) NULL,
        [Email] nvarchar(256) NULL,
        [NormalizedEmail] nvarchar(256) NULL,
        [EmailConfirmed] bit NOT NULL,
        [PasswordHash] nvarchar(max) NULL,
        [SecurityStamp] nvarchar(max) NULL,
        [ConcurrencyStamp] nvarchar(max) NULL,
        [PhoneNumber] nvarchar(max) NULL,
        [PhoneNumberConfirmed] bit NOT NULL,
        [TwoFactorEnabled] bit NOT NULL,
        [LockoutEnd] datetimeoffset NULL,
        [LockoutEnabled] bit NOT NULL,
        [AccessFailedCount] int NOT NULL,
        CONSTRAINT [PK_AspNetUsers] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260716190324_AddIdentityAndIndexes'
)
BEGIN
    CREATE TABLE [AspNetRoleClaims] (
        [Id] int NOT NULL IDENTITY,
        [RoleId] nvarchar(450) NOT NULL,
        [ClaimType] nvarchar(max) NULL,
        [ClaimValue] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetRoleClaims] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AspNetRoleClaims_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260716190324_AddIdentityAndIndexes'
)
BEGIN
    CREATE TABLE [AspNetUserClaims] (
        [Id] int NOT NULL IDENTITY,
        [UserId] nvarchar(450) NOT NULL,
        [ClaimType] nvarchar(max) NULL,
        [ClaimValue] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetUserClaims] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AspNetUserClaims_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260716190324_AddIdentityAndIndexes'
)
BEGIN
    CREATE TABLE [AspNetUserLogins] (
        [LoginProvider] nvarchar(450) NOT NULL,
        [ProviderKey] nvarchar(450) NOT NULL,
        [ProviderDisplayName] nvarchar(max) NULL,
        [UserId] nvarchar(450) NOT NULL,
        CONSTRAINT [PK_AspNetUserLogins] PRIMARY KEY ([LoginProvider], [ProviderKey]),
        CONSTRAINT [FK_AspNetUserLogins_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260716190324_AddIdentityAndIndexes'
)
BEGIN
    CREATE TABLE [AspNetUserRoles] (
        [UserId] nvarchar(450) NOT NULL,
        [RoleId] nvarchar(450) NOT NULL,
        CONSTRAINT [PK_AspNetUserRoles] PRIMARY KEY ([UserId], [RoleId]),
        CONSTRAINT [FK_AspNetUserRoles_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_AspNetUserRoles_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260716190324_AddIdentityAndIndexes'
)
BEGIN
    CREATE TABLE [AspNetUserTokens] (
        [UserId] nvarchar(450) NOT NULL,
        [LoginProvider] nvarchar(450) NOT NULL,
        [Name] nvarchar(450) NOT NULL,
        [Value] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetUserTokens] PRIMARY KEY ([UserId], [LoginProvider], [Name]),
        CONSTRAINT [FK_AspNetUserTokens_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260716190324_AddIdentityAndIndexes'
)
BEGIN
    CREATE INDEX [IX_MovimientoInventario_Fecha] ON [MovimientoInventario] ([Fecha]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260716190324_AddIdentityAndIndexes'
)
BEGIN
    CREATE INDEX [IX_MovimientoInventario_IdInsumo_Fecha] ON [MovimientoInventario] ([IdInsumo], [Fecha]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260716190324_AddIdentityAndIndexes'
)
BEGIN
    CREATE INDEX [IX_MovimientoInventario_TipoMovimiento] ON [MovimientoInventario] ([TipoMovimiento]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260716190324_AddIdentityAndIndexes'
)
BEGIN
    CREATE INDEX [IX_Insumo_CodigoFabrica] ON [Insumo] ([CodigoFabrica]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260716190324_AddIdentityAndIndexes'
)
BEGIN
    CREATE INDEX [IX_AspNetRoleClaims_RoleId] ON [AspNetRoleClaims] ([RoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260716190324_AddIdentityAndIndexes'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [RoleNameIndex] ON [AspNetRoles] ([NormalizedName]) WHERE [NormalizedName] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260716190324_AddIdentityAndIndexes'
)
BEGIN
    CREATE INDEX [IX_AspNetUserClaims_UserId] ON [AspNetUserClaims] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260716190324_AddIdentityAndIndexes'
)
BEGIN
    CREATE INDEX [IX_AspNetUserLogins_UserId] ON [AspNetUserLogins] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260716190324_AddIdentityAndIndexes'
)
BEGIN
    CREATE INDEX [IX_AspNetUserRoles_RoleId] ON [AspNetUserRoles] ([RoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260716190324_AddIdentityAndIndexes'
)
BEGIN
    CREATE INDEX [EmailIndex] ON [AspNetUsers] ([NormalizedEmail]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260716190324_AddIdentityAndIndexes'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UserNameIndex] ON [AspNetUsers] ([NormalizedUserName]) WHERE [NormalizedUserName] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260716190324_AddIdentityAndIndexes'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260716190324_AddIdentityAndIndexes', N'9.0.2');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260723203023_AddValorUnidadMedidaInsumos'
)
BEGIN
    ALTER TABLE [Insumo] ADD [UnidadMedida] nvarchar(20) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260723203023_AddValorUnidadMedidaInsumos'
)
BEGIN
    ALTER TABLE [Insumo] ADD [ValorMedida] decimal(18,2) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260723203023_AddValorUnidadMedidaInsumos'
)
BEGIN

                    UPDATE Insumo
                    SET 
                        ValorMedida = TRY_CAST(SUBSTRING(LTRIM(Descripcion), 1, CHARINDEX(' ', LTRIM(Descripcion)) - 1) AS DECIMAL(18,2)),
                        UnidadMedida = LEFT(LTRIM(RTRIM(SUBSTRING(LTRIM(Descripcion), CHARINDEX(' ', LTRIM(Descripcion)) + 1, LEN(Descripcion)))), 20)
                    WHERE 
                        Descripcion IS NOT NULL 
                        AND CHARINDEX(' ', LTRIM(Descripcion)) > 0
                        AND TRY_CAST(SUBSTRING(LTRIM(Descripcion), 1, CHARINDEX(' ', LTRIM(Descripcion)) - 1) AS DECIMAL(18,2)) IS NOT NULL
                        AND ValorMedida IS NULL;
                
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260723203023_AddValorUnidadMedidaInsumos'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260723203023_AddValorUnidadMedidaInsumos', N'9.0.2');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260729192249_UpdateArchitecture'
)
BEGIN
    ALTER TABLE [MovimientoInventario] ADD [IdUbicacion] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260729192249_UpdateArchitecture'
)
BEGIN
    ALTER TABLE [MovimientoInventario] ADD [IdUbicacionAnterior] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260729192249_UpdateArchitecture'
)
BEGIN
    ALTER TABLE [MovimientoInventario] ADD [UsuarioRegistro] nvarchar(255) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260729192249_UpdateArchitecture'
)
BEGIN
    CREATE TABLE [UnidadMedida] (
        [Id] int NOT NULL IDENTITY,
        [Nombre] nvarchar(20) NOT NULL,
        [IdCategoria] int NOT NULL,
        CONSTRAINT [PK_UnidadMedida] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_UnidadMedida_CategoriaInsumo_IdCategoria] FOREIGN KEY ([IdCategoria]) REFERENCES [CategoriaInsumo] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260729192249_UpdateArchitecture'
)
BEGIN
    CREATE INDEX [IX_MovimientoInventario_IdUbicacion] ON [MovimientoInventario] ([IdUbicacion]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260729192249_UpdateArchitecture'
)
BEGIN
    CREATE INDEX [IX_MovimientoInventario_IdUbicacionAnterior] ON [MovimientoInventario] ([IdUbicacionAnterior]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260729192249_UpdateArchitecture'
)
BEGIN
    CREATE INDEX [IX_UnidadMedida_IdCategoria] ON [UnidadMedida] ([IdCategoria]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260729192249_UpdateArchitecture'
)
BEGIN
    ALTER TABLE [MovimientoInventario] ADD CONSTRAINT [FK_MovimientoInventario_Ubicacion_IdUbicacion] FOREIGN KEY ([IdUbicacion]) REFERENCES [Ubicacion] ([Id]) ON DELETE NO ACTION;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260729192249_UpdateArchitecture'
)
BEGIN
    ALTER TABLE [MovimientoInventario] ADD CONSTRAINT [FK_MovimientoInventario_Ubicacion_IdUbicacionAnterior] FOREIGN KEY ([IdUbicacionAnterior]) REFERENCES [Ubicacion] ([Id]) ON DELETE NO ACTION;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260729192249_UpdateArchitecture'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260729192249_UpdateArchitecture', N'9.0.2');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730162325_AddAuditoriaTable'
)
BEGIN
    CREATE TABLE [Auditoria] (
        [Id] int NOT NULL IDENTITY,
        [Fecha] datetime2 NOT NULL,
        [Usuario] nvarchar(100) NOT NULL,
        [Accion] nvarchar(50) NOT NULL,
        [Modulo] nvarchar(50) NOT NULL,
        [Detalles] varchar(max) NOT NULL,
        CONSTRAINT [PK_Auditoria] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730162325_AddAuditoriaTable'
)
BEGIN
    CREATE INDEX [IX_Auditoria_Fecha] ON [Auditoria] ([Fecha]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730162325_AddAuditoriaTable'
)
BEGIN
    CREATE INDEX [IX_Auditoria_Modulo] ON [Auditoria] ([Modulo]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260730162325_AddAuditoriaTable'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260730162325_AddAuditoriaTable', N'9.0.2');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260803231311_AddMonedas'
)
BEGIN
    ALTER TABLE [MovimientoInventario] ADD [Moneda] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260803231311_AddMonedas'
)
BEGIN
    ALTER TABLE [Insumo] ADD [Moneda] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260803231311_AddMonedas'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260803231311_AddMonedas', N'9.0.2');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804010055_UpdateDeleteBehaviors'
)
BEGIN
    ALTER TABLE [MovimientoInventario] DROP CONSTRAINT [FK_MovimientoInventario_EstadoSalida_IdEstadoSalida];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804010055_UpdateDeleteBehaviors'
)
BEGIN
    ALTER TABLE [MovimientoInventario] DROP CONSTRAINT [FK_MovimientoInventario_Proveedor_IdProveedor];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804010055_UpdateDeleteBehaviors'
)
BEGIN
    ALTER TABLE [MovimientoInventario] DROP CONSTRAINT [FK_MovimientoInventario_Proyecto_IdProyecto];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804010055_UpdateDeleteBehaviors'
)
BEGIN
    ALTER TABLE [MovimientoInventario] DROP CONSTRAINT [FK_MovimientoInventario_TipoCompra_IdTipoCompra];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804010055_UpdateDeleteBehaviors'
)
BEGIN
    ALTER TABLE [MovimientoInventario] ADD CONSTRAINT [FK_MovimientoInventario_EstadoSalida_IdEstadoSalida] FOREIGN KEY ([IdEstadoSalida]) REFERENCES [EstadoSalida] ([Id]) ON DELETE NO ACTION;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804010055_UpdateDeleteBehaviors'
)
BEGIN
    ALTER TABLE [MovimientoInventario] ADD CONSTRAINT [FK_MovimientoInventario_Proveedor_IdProveedor] FOREIGN KEY ([IdProveedor]) REFERENCES [Proveedor] ([Id]) ON DELETE NO ACTION;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804010055_UpdateDeleteBehaviors'
)
BEGIN
    ALTER TABLE [MovimientoInventario] ADD CONSTRAINT [FK_MovimientoInventario_Proyecto_IdProyecto] FOREIGN KEY ([IdProyecto]) REFERENCES [Proyecto] ([Id]) ON DELETE NO ACTION;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804010055_UpdateDeleteBehaviors'
)
BEGIN
    ALTER TABLE [MovimientoInventario] ADD CONSTRAINT [FK_MovimientoInventario_TipoCompra_IdTipoCompra] FOREIGN KEY ([IdTipoCompra]) REFERENCES [TipoCompra] ([Id]) ON DELETE NO ACTION;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804010055_UpdateDeleteBehaviors'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260804010055_UpdateDeleteBehaviors', N'9.0.2');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804213331_ChangeValorMedidaPrecision'
)
BEGIN
    DECLARE @var sysname;
    SELECT @var = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Insumo]') AND [c].[name] = N'ValorMedida');
    IF @var IS NOT NULL EXEC(N'ALTER TABLE [Insumo] DROP CONSTRAINT [' + @var + '];');
    ALTER TABLE [Insumo] ALTER COLUMN [ValorMedida] decimal(18,6) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260804213331_ChangeValorMedidaPrecision'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260804213331_ChangeValorMedidaPrecision', N'9.0.2');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805144611_AddFamiliasEmpaquetamiento'
)
BEGIN
    ALTER TABLE [Empaquetamiento] ADD [IdFamiliaEmpaquetamiento] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805144611_AddFamiliasEmpaquetamiento'
)
BEGIN
    CREATE TABLE [FamiliaEmpaquetamiento] (
        [Id] int NOT NULL IDENTITY,
        [Nombre] nvarchar(60) NOT NULL,
        CONSTRAINT [PK_FamiliaEmpaquetamiento] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805144611_AddFamiliasEmpaquetamiento'
)
BEGIN
    CREATE TABLE [CategoriaFamiliaEmpaquetamiento] (
        [Id] int NOT NULL IDENTITY,
        [IdCategoria] int NOT NULL,
        [IdFamiliaEmpaquetamiento] int NOT NULL,
        CONSTRAINT [PK_CategoriaFamiliaEmpaquetamiento] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_CategoriaFamiliaEmpaquetamiento_CategoriaInsumo_IdCategoria] FOREIGN KEY ([IdCategoria]) REFERENCES [CategoriaInsumo] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_CategoriaFamiliaEmpaquetamiento_FamiliaEmpaquetamiento_IdFamiliaEmpaquetamiento] FOREIGN KEY ([IdFamiliaEmpaquetamiento]) REFERENCES [FamiliaEmpaquetamiento] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805144611_AddFamiliasEmpaquetamiento'
)
BEGIN
    CREATE INDEX [IX_Empaquetamiento_IdFamiliaEmpaquetamiento] ON [Empaquetamiento] ([IdFamiliaEmpaquetamiento]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805144611_AddFamiliasEmpaquetamiento'
)
BEGIN
    CREATE UNIQUE INDEX [IX_CategoriaFamiliaEmpaquetamiento_Cat_Familia] ON [CategoriaFamiliaEmpaquetamiento] ([IdCategoria], [IdFamiliaEmpaquetamiento]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805144611_AddFamiliasEmpaquetamiento'
)
BEGIN
    CREATE INDEX [IX_CategoriaFamiliaEmpaquetamiento_IdFamiliaEmpaquetamiento] ON [CategoriaFamiliaEmpaquetamiento] ([IdFamiliaEmpaquetamiento]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805144611_AddFamiliasEmpaquetamiento'
)
BEGIN
    CREATE UNIQUE INDEX [IX_FamiliaEmpaquetamiento_Nombre] ON [FamiliaEmpaquetamiento] ([Nombre]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805144611_AddFamiliasEmpaquetamiento'
)
BEGIN
    ALTER TABLE [Empaquetamiento] ADD CONSTRAINT [FK_Empaquetamiento_FamiliaEmpaquetamiento_IdFamiliaEmpaquetamiento] FOREIGN KEY ([IdFamiliaEmpaquetamiento]) REFERENCES [FamiliaEmpaquetamiento] ([Id]) ON DELETE NO ACTION;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805144611_AddFamiliasEmpaquetamiento'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'Nombre') AND [object_id] = OBJECT_ID(N'[FamiliaEmpaquetamiento]'))
        SET IDENTITY_INSERT [FamiliaEmpaquetamiento] ON;
    EXEC(N'INSERT INTO [FamiliaEmpaquetamiento] ([Id], [Nombre])
    VALUES (1, N''Pasivos SMD''),
    (2, N''THT General''),
    (3, N''Discretos y Potencia''),
    (4, N''ICs y Microcontroladores''),
    (5, N''Genéricos y Otros'')');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'Nombre') AND [object_id] = OBJECT_ID(N'[FamiliaEmpaquetamiento]'))
        SET IDENTITY_INSERT [FamiliaEmpaquetamiento] OFF;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805144611_AddFamiliasEmpaquetamiento'
)
BEGIN

                    -- Pasivos SMD: categorías de componentes pasivos
                    INSERT INTO [CategoriaFamiliaEmpaquetamiento] ([IdCategoria], [IdFamiliaEmpaquetamiento])
                    SELECT c.[Id], 1 FROM [CategoriaInsumo] c
                    WHERE UPPER(LTRIM(RTRIM(c.[Nombre]))) IN ('RESISTENCIA','CONDENSADOR','INDUCTANCIA','CRISTAL');

                    -- Discretos y Potencia
                    INSERT INTO [CategoriaFamiliaEmpaquetamiento] ([IdCategoria], [IdFamiliaEmpaquetamiento])
                    SELECT c.[Id], 3 FROM [CategoriaInsumo] c
                    WHERE UPPER(LTRIM(RTRIM(c.[Nombre]))) IN ('DIODO','TRANSISTOR','POTENCIOMETRO');

                    -- ICs y Microcontroladores
                    INSERT INTO [CategoriaFamiliaEmpaquetamiento] ([IdCategoria], [IdFamiliaEmpaquetamiento])
                    SELECT c.[Id], 4 FROM [CategoriaInsumo] c
                    WHERE UPPER(LTRIM(RTRIM(c.[Nombre]))) IN ('INTEGRADO','MICROCONTROLADOR');

                    -- THT General: todas excepto ICs/Micro (que no usan inserción por patas)
                    INSERT INTO [CategoriaFamiliaEmpaquetamiento] ([IdCategoria], [IdFamiliaEmpaquetamiento])
                    SELECT c.[Id], 2 FROM [CategoriaInsumo] c
                    WHERE UPPER(LTRIM(RTRIM(c.[Nombre]))) NOT IN ('INTEGRADO','MICROCONTROLADOR');

                    -- Genéricos: TODAS las categorías (fallback)
                    INSERT INTO [CategoriaFamiliaEmpaquetamiento] ([IdCategoria], [IdFamiliaEmpaquetamiento])
                    SELECT c.[Id], 5 FROM [CategoriaInsumo] c;
                
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805144611_AddFamiliasEmpaquetamiento'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260805144611_AddFamiliasEmpaquetamiento', N'9.0.2');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805190101_RemoveIdUbicacionFromInsumo'
)
BEGIN
    ALTER TABLE [Insumo] DROP CONSTRAINT [FK_Insumo_Ubicacion_IdUbicacion];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805190101_RemoveIdUbicacionFromInsumo'
)
BEGIN
    DROP INDEX [IX_Insumo_IdUbicacion] ON [Insumo];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805190101_RemoveIdUbicacionFromInsumo'
)
BEGIN
    DECLARE @var1 sysname;
    SELECT @var1 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Insumo]') AND [c].[name] = N'IdUbicacion');
    IF @var1 IS NOT NULL EXEC(N'ALTER TABLE [Insumo] DROP CONSTRAINT [' + @var1 + '];');
    ALTER TABLE [Insumo] DROP COLUMN [IdUbicacion];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805190101_RemoveIdUbicacionFromInsumo'
)
BEGIN
    ALTER TABLE [Insumo] ADD [UbicacionId] int NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805190101_RemoveIdUbicacionFromInsumo'
)
BEGIN
    CREATE INDEX [IX_Insumo_UbicacionId] ON [Insumo] ([UbicacionId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805190101_RemoveIdUbicacionFromInsumo'
)
BEGIN
    ALTER TABLE [Insumo] ADD CONSTRAINT [FK_Insumo_Ubicacion_UbicacionId] FOREIGN KEY ([UbicacionId]) REFERENCES [Ubicacion] ([Id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805190101_RemoveIdUbicacionFromInsumo'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260805190101_RemoveIdUbicacionFromInsumo', N'9.0.2');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805190228_RemoveUbicacionIdFromInsumo'
)
BEGIN
    ALTER TABLE [Insumo] DROP CONSTRAINT [FK_Insumo_Ubicacion_UbicacionId];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805190228_RemoveUbicacionIdFromInsumo'
)
BEGIN
    DROP INDEX [IX_Insumo_UbicacionId] ON [Insumo];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805190228_RemoveUbicacionIdFromInsumo'
)
BEGIN
    DECLARE @var2 sysname;
    SELECT @var2 = [d].[name]
    FROM [sys].[default_constraints] [d]
    INNER JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
    WHERE ([d].[parent_object_id] = OBJECT_ID(N'[Insumo]') AND [c].[name] = N'UbicacionId');
    IF @var2 IS NOT NULL EXEC(N'ALTER TABLE [Insumo] DROP CONSTRAINT [' + @var2 + '];');
    ALTER TABLE [Insumo] DROP COLUMN [UbicacionId];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260805190228_RemoveUbicacionIdFromInsumo'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260805190228_RemoveUbicacionIdFromInsumo', N'9.0.2');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260901172805_AddAvatarUrlToApplicationUser'
)
BEGIN
    ALTER TABLE [AspNetUsers] ADD [AvatarUrl] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260901172805_AddAvatarUrlToApplicationUser'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260901172805_AddAvatarUrlToApplicationUser', N'9.0.2');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260901175509_AddFechaDesactivacionToApplicationUser'
)
BEGIN
    ALTER TABLE [AspNetUsers] ADD [FechaDesactivacion] datetime2 NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260901175509_AddFechaDesactivacionToApplicationUser'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260901175509_AddFechaDesactivacionToApplicationUser', N'9.0.2');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260902151500_AddDebeCambiarPasswordToApplicationUser'
)
BEGIN
    ALTER TABLE [AspNetUsers] ADD [DebeCambiarPassword] bit NOT NULL DEFAULT CAST(0 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260902151500_AddDebeCambiarPasswordToApplicationUser'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260902151500_AddDebeCambiarPasswordToApplicationUser', N'9.0.2');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260904204243_AddIndexUsuarioAuditoria'
)
BEGIN
    CREATE INDEX [IX_Auditoria_Usuario] ON [Auditoria] ([Usuario]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260904204243_AddIndexUsuarioAuditoria'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260904204243_AddIndexUsuarioAuditoria', N'9.0.2');
END;

COMMIT;
GO

