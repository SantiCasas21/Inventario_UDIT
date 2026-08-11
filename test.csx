
using System.Data.SqlClient;

var connectionString = "Server=(localdb)\\MSSQLLocalDB;Database=InventarioUDIT;Trusted_Connection=True;MultipleActiveResultSets=true";

using (var connection = new SqlConnection(connectionString))
{
    connection.Open();
    var command = new SqlCommand("SELECT t.name AS TableName, fk.name AS FKName, c.name AS ColumnName FROM sys.foreign_key_columns fkc INNER JOIN sys.tables t ON fkc.parent_object_id = t.object_id INNER JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id INNER JOIN sys.foreign_keys fk ON fkc.constraint_object_id = fk.object_id WHERE fkc.referenced_object_id = OBJECT_ID('Insumo');", connection);
    using (var reader = command.ExecuteReader())
    {
        while (reader.Read())
        {
            Console.WriteLine($"Table: {reader[\"TableName\"]}, FK: {reader[\"FKName\"]}, Column: {reader[\"ColumnName\"]}");
        }
    }
}

