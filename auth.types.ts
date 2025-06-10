export interface User {
  id: string;
  email: string;
  nombre: string;
  cedula_number: string;
  phone?: string;
  cedula_frente?: string;
  cedula_dorso?: string;
  es_admin: boolean;
  bloqueado: boolean;
  created_at: Date;
  password_hash?: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  nombre: string;
  cedula_number: string;
  phone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user?: Partial<User>;
}