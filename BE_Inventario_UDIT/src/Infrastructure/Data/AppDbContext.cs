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

        // ==========================================
        // DbSet Transaccionales
        // ==========================================
        public DbSet<Proyecto> Proyectos => Set<Proyecto>();
        public DbSet<Insumo> Insumos => Set<Insumo>();

        // ==========================================
        // DbSet Kardex
        // ==========================================
        public DbSet<MovimientoInventario> MovimientosInventario => Set<MovimientoInventario>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

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
                      .HasColumnType("decimal(18,2)")
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

                // Relación con Ubicacion
                entity.HasOne(e => e.Ubicacion)
                      .WithMany(e => e.Insumos)
                      .HasForeignKey(e => e.IdUbicacion)
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
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.TipoCompra)
                      .WithMany(e => e.Movimientos)
                      .HasForeignKey(e => e.IdTipoCompra)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.Proyecto)
                      .WithMany(e => e.Movimientos)
                      .HasForeignKey(e => e.IdProyecto)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasOne(e => e.EstadoSalida)
                      .WithMany(e => e.Movimientos)
                      .HasForeignKey(e => e.IdEstadoSalida)
                      .OnDelete(DeleteBehavior.SetNull);

                // Índice para consultas frecuentes por insumo
                entity.HasIndex(e => e.IdInsumo, "IX_MovimientoInventario_IdInsumo");

                // Índices de rendimiento (auditoría)
                entity.HasIndex(e => e.Fecha, "IX_MovimientoInventario_Fecha");
                entity.HasIndex(e => e.TipoMovimiento, "IX_MovimientoInventario_TipoMovimiento");
                entity.HasIndex(e => new { e.IdInsumo, e.Fecha }, "IX_MovimientoInventario_IdInsumo_Fecha");
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
                   : "AJUSTE",
                v => v == "INGRESO" ? TipoMovimiento.Ingreso
                   : v == "SALIDA" ? TipoMovimiento.Salida
                   : TipoMovimiento.Ajuste)
        {
        }
    }
}

