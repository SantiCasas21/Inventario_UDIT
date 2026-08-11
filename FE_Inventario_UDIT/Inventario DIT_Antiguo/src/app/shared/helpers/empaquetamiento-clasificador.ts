/**
 * Clasificador inteligente de Empaquetamientos (espejo JS del backend
 * `EmpaquetamientoClasificador.cs`). Se usa para la auto-sugerencia en
 * tiempo real en el formulario de empaquetamiento.
 *
 * Devuelve el NOMBRE de la familia, que coincide con la tabla FamiliaEmpaquetamiento.
 *
 * Orden de reglas (importa): prefijos específicos (IC / Discretos / THT)
 * ANTES del patrón genérico de 4 dígitos para evitar falsos positivos.
 */

export const FAMILIA_PASIVOS_SMD = 'Pasivos SMD';
export const FAMILIA_THT_GENERAL = 'THT General';
export const FAMILIA_DISCRETOS_POTENCIA = 'Discretos y Potencia';
export const FAMILIA_ICS_MICRO = 'ICs y Microcontroladores';
export const FAMILIA_GENERICOS = 'Genéricos y Otros';

// Prefijos de encapsulados de circuitos integrados (multi-pines)
const ICS_PREFIJOS = [
  'SOIC', 'SOP', 'SSOP', 'TSSOP', 'QFN', 'DFN', 'WSON', 'VQFN',
  'TQFP', 'LQFP', 'MSOP', 'QSOP', 'PLCC', 'LGA', 'BGA',
];

// Prefijos de transistores / diodos / semiconductores discretos
const DISCRETOS_PREFIJOS = [
  'SOT', 'SOD', 'TO-', 'DO-', 'SC-', 'DPAK', 'D2PAK', 'SMA', 'SMB', 'SMC',
];

// Patrones de inserción por patas (THT)
const THT_PATRONES = ['DIP', 'PDIP', 'SIP', 'AXIAL', 'RADIAL', 'THT', 'HC-49'];

/** Clasifica un nombre de empaquetamiento en una familia. */
export function clasificarEmpaquetamiento(nombre?: string | null): string {
  if (!nombre || !nombre.trim()) {
    return FAMILIA_GENERICOS;
  }

  const n = nombre.trim().toUpperCase();

  // 1. ICs y Microcontroladores (encapsulados multi-pines).
  //    Usamos includes (no solo startsWith) porque los nombres suelen
  //    llevar el conteo de pines por delante (ej: "8-SOIC", "10-MSOP").
  if (ICS_PREFIJOS.some(p => n.includes(p))) {
    return FAMILIA_ICS_MICRO;
  }

  // 2. Discretos y Potencia (transistores, diodos, semiconductores)
  if (DISCRETOS_PREFIJOS.some(p => n.includes(p))) {
    return FAMILIA_DISCRETOS_POTENCIA;
  }

  // 3. THT General (inserción por patas)
  if (THT_PATRONES.some(p => n.includes(p))) {
    return FAMILIA_THT_GENERAL;
  }

  // 4. Pasivos SMD: patrón de 4 dígitos consecutivos (0402, 0603, 0805...)
  if (/\d{4}/.test(n)) {
    return FAMILIA_PASIVOS_SMD;
  }

  // 5. Fallback
  return FAMILIA_GENERICOS;
}
