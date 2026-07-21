export interface User {
  id: string;
  name: string; // Para compatibilidad con templates Fuse (usa nombreCompleto)
  username: string;
  email: string;
  nombreCompleto: string;
  role: string;
  activo: boolean;
  fechaCreacion: string;
  avatar?: string;
  status?: string;
}
