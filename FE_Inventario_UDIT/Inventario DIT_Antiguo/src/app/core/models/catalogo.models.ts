/** DTO genérico para todos los catálogos (CategoriaInsumo, Empaquetamiento, Ubicacion, etc.). */
export interface CatalogoDto {
  id: number;
  nombre: string;
  tipo: string; // Nombre de la entidad: "CategoriaInsumo", "Empaquetamiento", etc.
}

/** DTO para crear o actualizar un catálogo. */
export interface CatalogoRequestDto {
  nombre: string;
}

/** DTO de Empaquetamiento con su familia asociada. */
export interface EmpaquetamientoDto extends CatalogoDto {
  idFamiliaEmpaquetamiento: number | null;
  familiaEmpaquetamientoNombre: string | null;
}

/** DTO para crear/actualizar un Empaquetamiento (con familia). */
export interface EmpaquetamientoRequestDto {
  nombre: string;
  idFamiliaEmpaquetamiento?: number | null;
}
