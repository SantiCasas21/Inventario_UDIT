/** DTO para Proyecto con nombre de estado resuelto. */
export interface ProyectoDto {
  id: number;
  nombre: string;
  descripcion: string | null;
  idEstado: number;
  estadoNombre: string;
  fechaCreacion: string; // ISO 8601
}

/** DTO para crear/actualizar un Proyecto. */
export interface ProyectoRequest {
  nombre: string;
  descripcion?: string;
  idEstado: number;
}
