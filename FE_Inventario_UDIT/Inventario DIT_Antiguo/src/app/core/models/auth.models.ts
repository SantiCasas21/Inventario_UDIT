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
  nombreCompleto: string;
  role: string;
}

/** DTO para solicitud de registro (solo Admin). */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  nombreCompleto: string;
  role: string; // "Admin" | "Developer" | "Assistant" | "User"
}

/** DTO con la información del usuario autenticado. */
export interface UserInfo {
  id: string;
  username: string;
  email: string;
  nombreCompleto: string;
  role: string;
  activo: boolean;
  fechaCreacion: string;
}

/** Roles disponibles en el sistema. */
export type UserRole = 'Admin' | 'Developer' | 'Assistant' | 'User';
