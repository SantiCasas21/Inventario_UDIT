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
