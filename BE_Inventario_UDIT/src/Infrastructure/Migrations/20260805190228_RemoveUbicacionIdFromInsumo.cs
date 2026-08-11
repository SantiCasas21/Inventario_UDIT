using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveUbicacionIdFromInsumo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Insumo_Ubicacion_UbicacionId",
                table: "Insumo");

            migrationBuilder.DropIndex(
                name: "IX_Insumo_UbicacionId",
                table: "Insumo");

            migrationBuilder.DropColumn(
                name: "UbicacionId",
                table: "Insumo");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UbicacionId",
                table: "Insumo",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Insumo_UbicacionId",
                table: "Insumo",
                column: "UbicacionId");

            migrationBuilder.AddForeignKey(
                name: "FK_Insumo_Ubicacion_UbicacionId",
                table: "Insumo",
                column: "UbicacionId",
                principalTable: "Ubicacion",
                principalColumn: "Id");
        }
    }
}
