using System.Text.RegularExpressions;

namespace Application.Services
{
    /// <summary>
    /// Clasificador inteligente de Empaquetamientos según patrones del nombre.
    /// Clase pura y testeable (SRP) — devuelve el NOMBRE de la familia.
    ///
    /// Orden de reglas (importa): se verifican los prefijos específicos
    /// (IC / Discretos / THT) ANTES del patrón genérico de 4 dígitos para
    /// evitar falsos positivos (ej. "SOT-0805" debe ser Discretos, no Pasivos).
    /// </summary>
    public static class EmpaquetamientoClasificador
    {
        public const string PasivosSMD = "Pasivos SMD";
        public const string ThtGeneral = "THT General";
        public const string DiscretosPotencia = "Discretos y Potencia";
        public const string IcsMicro = "ICs y Microcontroladores";
        public const string Genericos = "Genéricos y Otros";

        // Prefijos de encapsulados de circuitos integrados (multi-pines)
        private static readonly string[] IcsPrefijos =
        {
            "SOIC", "SOP", "SSOP", "TSSOP", "QFN", "DFN", "WSON", "VQFN",
            "TQFP", "LQFP", "MSOP", "QSOP", "PLCC", "LGA", "BGA"
        };

        // Prefijos de transistores / diodos / semiconductores discretos
        private static readonly string[] DiscretosPrefijos =
        {
            "SOT", "SOD", "TO-", "DO-", "SC-", "DPAK", "D2PAK", "SMA", "SMB", "SMC"
        };

        // Patrones de inserción por patas (THT)
        private static readonly string[] ThtPatrones =
        {
            "DIP", "PDIP", "SIP", "AXIAL", "RADIAL", "THT", "HC-49"
        };

        /// <summary>
        /// Clasifica un nombre de empaquetamiento en una familia.
        /// </summary>
        public static string Clasificar(string? nombre)
        {
            if (string.IsNullOrWhiteSpace(nombre))
                return Genericos;

            var n = nombre.Trim().ToUpperInvariant();

            // 1. ICs y Microcontroladores (encapsulados multi-pines).
            //    Usamos Contains (no solo StartsWith) porque los nombres suelen
            //    llevar el conteo de pines por delante (ej: "8-SOIC", "10-MSOP").
            if (IcsPrefijos.Any(p => n.Contains(p, StringComparison.Ordinal)))
                return IcsMicro;

            // 2. Discretos y Potencia (transistores, diodos, semiconductores)
            if (DiscretosPrefijos.Any(p => n.Contains(p, StringComparison.Ordinal)))
                return DiscretosPotencia;

            // 3. THT General (inserción por patas)
            if (ThtPatrones.Any(p => n.Contains(p, StringComparison.Ordinal)))
                return ThtGeneral;

            // 4. Pasivos SMD: patrón de 4 dígitos consecutivos
            //    (0402, 0603, 0805, 1206, 2512...) o sufijos de tamaño pasivo
            if (Regex.IsMatch(n, @"\d{4}"))
                return PasivosSMD;

            // 5. Fallback
            return Genericos;
        }
    }
}
