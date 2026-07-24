using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddValorUnidadMedidaInsumos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UnidadMedida",
                table: "Insumo",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ValorMedida",
                table: "Insumo",
                type: "decimal(18,2)",
                nullable: true);

            // Migración de datos: Extraer "200 OHM" a ValorMedida = 200, UnidadMedida = 'OHM'
            // Solo aplica a filas donde la descripción comienza con un número seguido de espacio.
            migrationBuilder.Sql(@"
                UPDATE Insumo
                SET 
                    ValorMedida = TRY_CAST(SUBSTRING(LTRIM(Descripcion), 1, CHARINDEX(' ', LTRIM(Descripcion)) - 1) AS DECIMAL(18,2)),
                    UnidadMedida = LEFT(LTRIM(RTRIM(SUBSTRING(LTRIM(Descripcion), CHARINDEX(' ', LTRIM(Descripcion)) + 1, LEN(Descripcion)))), 20)
                WHERE 
                    Descripcion IS NOT NULL 
                    AND CHARINDEX(' ', LTRIM(Descripcion)) > 0
                    AND TRY_CAST(SUBSTRING(LTRIM(Descripcion), 1, CHARINDEX(' ', LTRIM(Descripcion)) - 1) AS DECIMAL(18,2)) IS NOT NULL
                    AND ValorMedida IS NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UnidadMedida",
                table: "Insumo");

            migrationBuilder.DropColumn(
                name: "ValorMedida",
                table: "Insumo");
        }
    }
}
