export interface User {
  id: string;
  name: string; // Para compatibilidad con templates Fuse (usa nombreCompleto)
  username: string;
  email: string;
  nombreCompleto: string;
  role: string;
  permissions?: string[];
  activo: boolean;
  debeCambiarPassword?: boolean;
  fechaCreacion: string;
  avatar?: string;
  status?: string;
}


