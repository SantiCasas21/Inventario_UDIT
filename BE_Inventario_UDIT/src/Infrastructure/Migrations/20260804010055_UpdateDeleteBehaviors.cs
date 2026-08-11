using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateDeleteBehaviors : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MovimientoInventario_EstadoSalida_IdEstadoSalida",
                table: "MovimientoInventario");

            migrationBuilder.DropForeignKey(
                name: "FK_MovimientoInventario_Proveedor_IdProveedor",
                table: "MovimientoInventario");

            migrationBuilder.DropForeignKey(
                name: "FK_MovimientoInventario_Proyecto_IdProyecto",
                table: "MovimientoInventario");

            migrationBuilder.DropForeignKey(
                name: "FK_MovimientoInventario_TipoCompra_IdTipoCompra",
                table: "MovimientoInventario");

            migrationBuilder.AddForeignKey(
                name: "FK_MovimientoInventario_EstadoSalida_IdEstadoSalida",
                table: "MovimientoInventario",
                column: "IdEstadoSalida",
                principalTable: "EstadoSalida",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MovimientoInventario_Proveedor_IdProveedor",
                table: "MovimientoInventario",
                column: "IdProveedor",
                principalTable: "Proveedor",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MovimientoInventario_Proyecto_IdProyecto",
                table: "MovimientoInventario",
                column: "IdProyecto",
                principalTable: "Proyecto",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MovimientoInventario_TipoCompra_IdTipoCompra",
                table: "MovimientoInventario",
                column: "IdTipoCompra",
                principalTable: "TipoCompra",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MovimientoInventario_EstadoSalida_IdEstadoSalida",
                table: "MovimientoInventario");

            migrationBuilder.DropForeignKey(
                name: "FK_MovimientoInventario_Proveedor_IdProveedor",
                table: "MovimientoInventario");

            migrationBuilder.DropForeignKey(
                name: "FK_MovimientoInventario_Proyecto_IdProyecto",
                table: "MovimientoInventario");

            migrationBuilder.DropForeignKey(
                name: "FK_MovimientoInventario_TipoCompra_IdTipoCompra",
                table: "MovimientoInventario");

            migrationBuilder.AddForeignKey(
                name: "FK_MovimientoInventario_EstadoSalida_IdEstadoSalida",
                table: "MovimientoInventario",
                column: "IdEstadoSalida",
                principalTable: "EstadoSalida",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_MovimientoInventario_Proveedor_IdProveedor",
                table: "MovimientoInventario",
                column: "IdProveedor",
                principalTable: "Proveedor",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_MovimientoInventario_Proyecto_IdProyecto",
                table: "MovimientoInventario",
                column: "IdProyecto",
                principalTable: "Proyecto",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_MovimientoInventario_TipoCompra_IdTipoCompra",
                table: "MovimientoInventario",
                column: "IdTipoCompra",
                principalTable: "TipoCompra",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
