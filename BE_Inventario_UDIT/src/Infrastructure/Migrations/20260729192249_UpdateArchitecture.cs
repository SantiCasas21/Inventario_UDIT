using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateArchitecture : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "IdUbicacion",
                table: "MovimientoInventario",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "IdUbicacionAnterior",
                table: "MovimientoInventario",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UsuarioRegistro",
                table: "MovimientoInventario",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "UnidadMedida",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IdCategoria = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UnidadMedida", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UnidadMedida_CategoriaInsumo_IdCategoria",
                        column: x => x.IdCategoria,
                        principalTable: "CategoriaInsumo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MovimientoInventario_IdUbicacion",
                table: "MovimientoInventario",
                column: "IdUbicacion");

            migrationBuilder.CreateIndex(
                name: "IX_MovimientoInventario_IdUbicacionAnterior",
                table: "MovimientoInventario",
                column: "IdUbicacionAnterior");

            migrationBuilder.CreateIndex(
                name: "IX_UnidadMedida_IdCategoria",
                table: "UnidadMedida",
                column: "IdCategoria");

            migrationBuilder.AddForeignKey(
                name: "FK_MovimientoInventario_Ubicacion_IdUbicacion",
                table: "MovimientoInventario",
                column: "IdUbicacion",
                principalTable: "Ubicacion",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MovimientoInventario_Ubicacion_IdUbicacionAnterior",
                table: "MovimientoInventario",
                column: "IdUbicacionAnterior",
                principalTable: "Ubicacion",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MovimientoInventario_Ubicacion_IdUbicacion",
                table: "MovimientoInventario");

            migrationBuilder.DropForeignKey(
                name: "FK_MovimientoInventario_Ubicacion_IdUbicacionAnterior",
                table: "MovimientoInventario");

            migrationBuilder.DropTable(
                name: "UnidadMedida");

            migrationBuilder.DropIndex(
                name: "IX_MovimientoInventario_IdUbicacion",
                table: "MovimientoInventario");

            migrationBuilder.DropIndex(
                name: "IX_MovimientoInventario_IdUbicacionAnterior",
                table: "MovimientoInventario");

            migrationBuilder.DropColumn(
                name: "IdUbicacion",
                table: "MovimientoInventario");

            migrationBuilder.DropColumn(
                name: "IdUbicacionAnterior",
                table: "MovimientoInventario");

            migrationBuilder.DropColumn(
                name: "UsuarioRegistro",
                table: "MovimientoInventario");
        }
    }
}
