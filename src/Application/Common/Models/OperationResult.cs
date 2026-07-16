namespace Application.Common.Models
{
    /// <summary>
    /// Envuelve el resultado de cualquier operación.
    /// Siempre se devuelve esto, nunca excepciones ni nulls sueltos.
    /// </summary>
    public class OperationResult<T>
    {
        /// <summary>¿La operación fue exitosa?</summary>
        public bool Success { get; set; }

        /// <summary>Mensaje descriptivo (error o confirmación)</summary>
        public string Message { get; set; } = string.Empty;

        /// <summary>Los datos devueltos (null si falló)</summary>
        public T? Data { get; set; }

        // --- Métodos fábrica para crear resultados rápido ---

        public static OperationResult<T> Ok(T data, string message = "Operación exitosa")
            => new() { Success = true, Message = message, Data = data };

        public static OperationResult<T> Fail(string message)
            => new() { Success = false, Message = message, Data = default };
    }

    /// <summary>
    /// Versión sin datos (para operaciones como eliminar).
    /// </summary>
    public class OperationResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;

        public static OperationResult Ok(string message = "Operación exitosa")
            => new() { Success = true, Message = message };

        public static OperationResult Fail(string message)
            => new() { Success = false, Message = message };
    }
}
