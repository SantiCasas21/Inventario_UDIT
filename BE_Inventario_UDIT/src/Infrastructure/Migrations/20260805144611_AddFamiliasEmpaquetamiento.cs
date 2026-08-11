using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFamiliasEmpaquetamiento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "IdFamiliaEmpaquetamiento",
                table: "Empaquetamiento",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "FamiliaEmpaquetamiento",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nombre = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FamiliaEmpaquetamiento", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CategoriaFamiliaEmpaquetamiento",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IdCategoria = table.Column<int>(type: "int", nullable: false),
                    IdFamiliaEmpaquetamiento = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CategoriaFamiliaEmpaquetamiento", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CategoriaFamiliaEmpaquetamiento_CategoriaInsumo_IdCategoria",
                        column: x => x.IdCategoria,
                        principalTable: "CategoriaInsumo",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CategoriaFamiliaEmpaquetamiento_FamiliaEmpaquetamiento_IdFamiliaEmpaquetamiento",
                        column: x => x.IdFamiliaEmpaquetamiento,
                        principalTable: "FamiliaEmpaquetamiento",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Empaquetamiento_IdFamiliaEmpaquetamiento",
                table: "Empaquetamiento",
                column: "IdFamiliaEmpaquetamiento");

            migrationBuilder.CreateIndex(
                name: "IX_CategoriaFamiliaEmpaquetamiento_Cat_Familia",
                table: "CategoriaFamiliaEmpaquetamiento",
                columns: new[] { "IdCategoria", "IdFamiliaEmpaquetamiento" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CategoriaFamiliaEmpaquetamiento_IdFamiliaEmpaquetamiento",
                table: "CategoriaFamiliaEmpaquetamiento",
                column: "IdFamiliaEmpaquetamiento");

            migrationBuilder.CreateIndex(
                name: "IX_FamiliaEmpaquetamiento_Nombre",
                table: "FamiliaEmpaquetamiento",
                column: "Nombre",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Empaquetamiento_FamiliaEmpaquetamiento_IdFamiliaEmpaquetamiento",
                table: "Empaquetamiento",
                column: "IdFamiliaEmpaquetamiento",
                principalTable: "FamiliaEmpaquetamiento",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // ==========================================
            // SEED: 5 familias de empaquetamiento (IDs fijos 1-5)
            // ==========================================
            migrationBuilder.InsertData(
                table: "FamiliaEmpaquetamiento",
                columns: new[] { "Id", "Nombre" },
                values: new object[,]
                {
                    { 1, "Pasivos SMD" },
                    { 2, "THT General" },
                    { 3, "Discretos y Potencia" },
                    { 4, "ICs y Microcontroladores" },
                    { 5, "Genéricos y Otros" }
                });

            // ==========================================
            // SEED: Vínculos Categoría → Familia (mapeo propuesto)
            // ==========================================
            migrationBuilder.Sql(@"
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
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Empaquetamiento_FamiliaEmpaquetamiento_IdFamiliaEmpaquetamiento",
                table: "Empaquetamiento");

            migrationBuilder.DropTable(
                name: "CategoriaFamiliaEmpaquetamiento");

            migrationBuilder.DropTable(
                name: "FamiliaEmpaquetamiento");

            migrationBuilder.DropIndex(
                name: "IX_Empaquetamiento_IdFamiliaEmpaquetamiento",
                table: "Empaquetamiento");

            migrationBuilder.DropColumn(
                name: "IdFamiliaEmpaquetamiento",
                table: "Empaquetamiento");
        }
    }
}
