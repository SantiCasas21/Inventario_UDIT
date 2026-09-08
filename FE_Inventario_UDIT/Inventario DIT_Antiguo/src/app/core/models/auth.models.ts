/** DTO para solicitud de login. */
export interface LoginRequest {
  username: string;
  password: string;
}

/** DTO de respuesta con el token JWT y datos del usuario. */
export interface LoginResponse {
  token: string;
  expiration: string; // ISO 8601
  username: string;
  email?: string;
  nombreCompleto: string;
  role: string;
  avatarUrl?: string;
  debeCambiarPassword?: boolean;
  permissions?: string[];
}


/** DTO para solicitud de registro (solo Admin). */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  nombreCompleto: string;
  role: string; // "Admin" | "Developer" | "Assistant" | "User"
}

/** DTO para creación de usuario por parte del Administrador */
export interface CreateUserAdminRequest {
  nombreCompleto: string;
  username: string;
  email: string;
  role: string;
}

/** DTO con la información del usuario autenticado. */
export interface UserInfo {
  id: string;
  username: string;
  email: string;
  nombreCompleto: string;
  role: string;
  avatarUrl?: string;
  debeCambiarPassword?: boolean;
  permissions?: string[];
  activo: boolean;
  fechaCreacion: string;
}


/** DTO para gestión de usuarios del sistema (admin). */
export interface UserDto {
  id: string;
  username: string;
  email: string;
  nombreCompleto: string;
  role: string;
  avatarUrl?: string;
  activo: boolean;
  debeCambiarPassword?: boolean;
  fechaDesactivacion?: string;
  diasRestantesEliminacion?: number;
  fechaCreacion: string;
}



/** Roles disponibles en el sistema. */
export type UserRole = 'Admin' | 'Developer' | 'Assistant' | 'User';
