using Domain.Entities;
using Domain.Entities.Catalogos;
using Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Infrastructure.Data
{
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // ==========================================
        // DbSet de Catálogos
        // ==========================================
        public DbSet<CategoriaInsumo> CategoriaInsumos => Set<CategoriaInsumo>();
        public DbSet<Empaquetamiento> Empaquetamientos => Set<Empaquetamiento>();
        public DbSet<Ubicacion> Ubicaciones => Set<Ubicacion>();
        public DbSet<TipoCompra> TiposCompra => Set<TipoCompra>();
        public DbSet<EstadoSalida> EstadosSalida => Set<EstadoSalida>();
        public DbSet<EstadoProyecto> EstadosProyecto => Set<EstadoProyecto>();
        public DbSet<Proveedor> Proveedores => Set<Proveedor>();
        public DbSet<Personal> Personal => Set<Personal>();
        public DbSet<UnidadMedida> UnidadesMedida => Set<UnidadMedida>();
        public DbSet<FamiliaEmpaquetamiento> FamiliasEmpaquetamiento => Set<FamiliaEmpaquetamiento>();
        public DbSet<CategoriaFamiliaEmpaquetamiento> CategoriaFamiliasEmpaquetamiento => Set<CategoriaFamiliaEmpaquetamiento>();

        // ==========================================
        // DbSet Transaccionales
        // ==========================================
        public DbSet<Proyecto> Proyectos => Set<Proyecto>();
        public DbSet<Insumo> Insumos => Set<Insumo>();

        // ==========================================
        // DbSet Kardex
        // ==========================================
        public DbSet<MovimientoInventario> MovimientosInventario => Set<MovimientoInventario>();
        public DbSet<Auditoria> Auditorias => Set<Auditoria>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configurar navegación de ApplicationUser a sus roles (para JOIN sin N+1)
            modelBuilder.Entity<ApplicationUser>()
                .HasMany(u => u.UserRoles)
                .WithOne()
                .HasForeignKey(ur => ur.UserId)
                .IsRequired();

            // ==========================================
            // Configuración de Catálogos
            // ==========================================

            modelBuilder.Entity<CategoriaInsumo>(entity =>
            {
                entity.ToTable("CategoriaInsumo");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(100);
            });

            modelBuilder.Entity<Empaquetamiento>(entity =>
            {
                entity.ToTable("Empaquetamiento");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Tipo).IsRequired().HasMaxLength(50);

                // Relación opcional con FamiliaEmpaquetamiento
                entity.HasOne(e => e.FamiliaEmpaquetamiento)
                      .WithMany(e => e.Empaquetamientos)
                      .HasForeignKey(e => e.IdFamiliaEmpaquetamiento)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.IdFamiliaEmpaquetamiento, "IX_Empaquetamiento_IdFamiliaEmpaquetamiento");
            });

            modelBuilder.Entity<FamiliaEmpaquetamiento>(entity =>
            {
                entity.ToTable("FamiliaEmpaquetamiento");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(60);
                entity.HasIndex(e => e.Nombre, "IX_FamiliaEmpaquetamiento_Nombre").IsUnique();
            });

            modelBuilder.Entity<CategoriaFamiliaEmpaquetamiento>(entity =>
            {
                entity.ToTable("CategoriaFamiliaEmpaquetamiento");
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.Categoria)
                      .WithMany()
                      .HasForeignKey(e => e.IdCategoria)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.FamiliaEmpaquetamiento)
                      .WithMany(e => e.CategoriaFamilias)
                      .HasForeignKey(e => e.IdFamiliaEmpaquetamiento)
                      .OnDelete(DeleteBehavior.Restrict);

                // Evitar vínculos duplicados
                entity.HasIndex(e => new { e.IdCategoria, e.IdFamiliaEmpaquetamiento }, "IX_CategoriaFamiliaEmpaquetamiento_Cat_Familia").IsUnique();
            });

            modelBuilder.Entity<Ubicacion>(entity =>
            {
                entity.ToTable("Ubicacion");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(100);
            });

            modelBuilder.Entity<TipoCompra>(entity =>
            {
                entity.ToTable("TipoCompra");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(50);
            });

            modelBuilder.Entity<EstadoSalida>(entity =>
            {
                entity.ToTable("EstadoSalida");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(50);
            });

            modelBuilder.Entity<EstadoProyecto>(entity =>
            {
                entity.ToTable("EstadoProyecto");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Estado).IsRequired().HasMaxLength(50);
            });

            modelBuilder.Entity<Proveedor>(entity =>
            {
                entity.ToTable("Proveedor");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Contacto).HasMaxLength(100);
                entity.Property(e => e.Direccion).HasMaxLength(255);
            });

            modelBuilder.Entity<Personal>(entity =>
            {
                entity.ToTable("Personal");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Cargo).HasMaxLength(100);
            });

            modelBuilder.Entity<UnidadMedida>(entity =>
            {
                entity.ToTable("UnidadMedida");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(20);

                entity.HasOne(e => e.Categoria)
                      .WithMany() // No need for reverse navigation if not defined
                      .HasForeignKey(e => e.IdCategoria)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ==========================================
            // Configuración de Proyecto
            // ==========================================

            modelBuilder.Entity<Proyecto>(entity =>
            {
                entity.ToTable("Proyecto");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Nombre).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Descripcion).HasMaxLength(255);
                entity.Property(e => e.FechaCreacion).HasDefaultValueSql("GETDATE()");

                entity.HasOne(e => e.Estado)
                      .WithMany(e => e.Proyectos)
                      .HasForeignKey(e => e.IdEstado)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // ==========================================
            // Configuración de Insumo
            // ==========================================

            modelBuilder.Entity<Insumo>(entity =>
            {
                entity.ToTable("Insumo");
                entity.HasKey(e => e.Id);

                entity.Property(e => e.CodigoFabrica)
                      .IsRequired()
                      .HasMaxLength(100)
                      .HasColumnName("CodigoFabrica");

                entity.Property(e => e.Descripcion).HasColumnType("varchar(max)");

                entity.Property(e => e.PrecioReferencia)
                      .HasColumnType("decimal(18,2)")
                      .HasColumnName("PrecioReferencia");

                entity.Property(e => e.ValorMedida)
                      .HasColumnType("decimal(18,6)")
                      .HasColumnName("ValorMedida");

                entity.Property(e => e.UnidadMedida)
                      .HasMaxLength(20)
                      .HasColumnName("UnidadMedida");

                // Relación con Categoria
                entity.HasOne(e => e.Categoria)
                      .WithMany(e => e.Insumos)
                      .HasForeignKey(e => e.IdCategoria)
                      .OnDelete(DeleteBehavior.Restrict);

                // Relación con Empaquetamiento
                entity.HasOne(e => e.Empaquetamiento)
                      .WithMany(e => e.Insumos)
                      .HasForeignKey(e => e.IdEmpaquetamiento)
                      .OnDelete(DeleteBehavior.Restrict);

                // Índice para búsqueda y ordenamiento por código de fábrica
                entity.HasIndex(e => e.CodigoFabrica, "IX_Insumo_CodigoFabrica");
            });

            // ==========================================
            // Configuración de MovimientoInventario (Kardex)
            // ==========================================

            modelBuilder.Entity<MovimientoInventario>(entity =>
            {
                entity.ToTable("MovimientoInventario");
                entity.HasKey(e => e.Id);

                entity.Property(e => e.TipoMovimiento)
                      .IsRequired()
                      .HasMaxLength(10)
                      .HasConversion(new TipoMovimientoConverter());

                entity.Property(e => e.Cantidad).IsRequired();
                entity.Property(e => e.Fecha).HasDefaultValueSql("GETDATE()");
                entity.Property(e => e.PrecioUnitario).HasColumnType("decimal(18,2)");
                entity.Property(e => e.Observacion).HasMaxLength(255);

                // Relación obligatoria con Insumo
                entity.HasOne(e => e.Insumo)
                      .WithMany(e => e.Movimientos)
                      .HasForeignKey(e => e.IdInsumo)
                      .OnDelete(DeleteBehavior.Restrict);

                // Relaciones opcionales
                entity.HasOne(e => e.Proveedor)
                      .WithMany(e => e.Movimientos)
                      .HasForeignKey(e => e.IdProveedor)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.TipoCompra)
                      .WithMany(e => e.Movimientos)
                      .HasForeignKey(e => e.IdTipoCompra)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Proyecto)
                      .WithMany(e => e.Movimientos)
                      .HasForeignKey(e => e.IdProyecto)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.EstadoSalida)
                      .WithMany(e => e.Movimientos)
                      .HasForeignKey(e => e.IdEstadoSalida)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Ubicacion)
                      .WithMany()
                      .HasForeignKey(e => e.IdUbicacion)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.UbicacionAnterior)
                      .WithMany()
                      .HasForeignKey(e => e.IdUbicacionAnterior)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.Property(e => e.UsuarioRegistro).HasMaxLength(255);

                // Índice para consultas frecuentes por insumo
                entity.HasIndex(e => e.IdInsumo, "IX_MovimientoInventario_IdInsumo");

                // Índices de rendimiento (auditoría)
                entity.HasIndex(e => e.Fecha, "IX_MovimientoInventario_Fecha");
                entity.HasIndex(e => e.TipoMovimiento, "IX_MovimientoInventario_TipoMovimiento");
                entity.HasIndex(e => new { e.IdInsumo, e.Fecha }, "IX_MovimientoInventario_IdInsumo_Fecha");
            });

            // ==========================================
            // Configuración de Auditoría
            // ==========================================
            modelBuilder.Entity<Auditoria>(entity =>
            {
                entity.ToTable("Auditoria");
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Usuario).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Accion).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Modulo).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Detalles).HasColumnType("varchar(max)");
                
                // Índices para búsquedas rápidas
                entity.HasIndex(e => e.Fecha, "IX_Auditoria_Fecha");
                entity.HasIndex(e => e.Modulo, "IX_Auditoria_Modulo");
                entity.HasIndex(e => e.Usuario, "IX_Auditoria_Usuario");
            });
        }
    }

    /// <summary>
    /// ValueConverter personalizado para convertir el enum TipoMovimiento
    /// a su representación en string ("INGRESO", "SALIDA", "AJUSTE") en la BD.
    /// </summary>
    public class TipoMovimientoConverter : ValueConverter<TipoMovimiento, string>
    {
        public TipoMovimientoConverter()
            : base(
                v => v == TipoMovimiento.Ingreso ? "INGRESO"
                   : v == TipoMovimiento.Salida ? "SALIDA"
                   : v == TipoMovimiento.Unificacion ? "UNIFICAR"
                   : v == TipoMovimiento.Traslado ? "TRASLADO"
                   : "AJUSTE",
                v => v == "INGRESO" ? TipoMovimiento.Ingreso
                   : v == "SALIDA" ? TipoMovimiento.Salida
                   : v == "UNIFICAR" ? TipoMovimiento.Unificacion
                   : v == "TRASLADO" ? TipoMovimiento.Traslado
                   : TipoMovimiento.Ajuste)
        {
        }
    }
}

