// Servicio de autenticación para manejar JWT y comunicación con backend PHP

import { config, logger } from '../config';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

export interface AuthError {
  error: string;
}

class AuthService {
  private tokenKey = config.auth.tokenKey;

  // Función de logging para debug
  private log(message: string, data?: any): void {
    logger.debug(`[AuthService] ${message}`, data);
  }

  // Obtener el token del localStorage
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Guardar el token en localStorage
  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  // Eliminar el token del localStorage
  removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  // Verificar si hay un token válido
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Decodificar el JWT para verificar si no ha expirado
      const payload = this.decodeJWT(token);
      const currentTime = Math.floor(Date.now() / 1000);
      
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  // Decodificar JWT (solo el payload, sin verificar firma)
  private decodeJWT(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Token inválido');
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  }

  // Obtener información del usuario del token
  getUserFromToken(): any | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      return this.decodeJWT(token);
    } catch {
      return null;
    }
  }

  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    this.log('Intentando login', { email: credentials.email, apiUrl: `${config.api.baseUrl}/login.php` });
    
    const response = await fetch(`${config.api.baseUrl}/login.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    this.log('Respuesta del servidor', { status: response.status, hasToken: !!data.token });

    if (!response.ok) {
      this.log('Error de login', data);
      throw new Error(data.error || 'Error de autenticación');
    }

    // Guardar el token automáticamente
    if (data.token) {
      this.setToken(data.token);
      this.log('Token guardado exitosamente');
    }

    return data;
  }

  // Logout
  logout(): void {
    this.removeToken();
  }

  // Hacer peticiones autenticadas
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = this.getToken();
    
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers,
    });
  }

  // Validar token con el servidor
  async validateToken(): Promise<boolean> {
    try {
      this.log('Validando token con el servidor');
      const response = await this.authenticatedFetch(`${config.api.baseUrl}/validate_token.php`);
      this.log('Resultado de validación', { isValid: response.ok });
      return response.ok;
    } catch (error) {
      this.log('Error validando token', error);
      return false;
    }
  }
}

// Crear una instancia singleton
export const authService = new AuthService();

// Hook personalizado para React (opcional)
export const useAuth = () => {
  return {
    login: authService.login.bind(authService),
    logout: authService.logout.bind(authService),
    isAuthenticated: authService.isAuthenticated.bind(authService),
    getToken: authService.getToken.bind(authService),
    getUserFromToken: authService.getUserFromToken.bind(authService),
    validateToken: authService.validateToken.bind(authService),
  };
};