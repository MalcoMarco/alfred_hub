// Servicio para gestión de usuarios
import { config, logger } from '../config';
import { authService } from './auth';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'compliance_officer' | 'ceo' | 'ops_vp';
  active: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: User['role'];
  password: string;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: User['role'];
  password?: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
}

class UsersService {
  private baseUrl = `${config.api.baseUrl}/users.php`;

  // Listar todos los usuarios
  async getUsers(): Promise<User[]> {
    try {
      logger.debug('Obteniendo lista de usuarios');
      
      const response = await authService.authenticatedFetch(this.baseUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      logger.debug('Usuarios obtenidos', { count: data.length });
      
      return data;
    } catch (error) {
      logger.error('Error obteniendo usuarios', error);
      throw error;
    }
  }

  // Obtener un usuario por ID
  async getUser(id: number): Promise<User> {
    try {
      logger.debug('Obteniendo usuario', { id });
      
      const response = await authService.authenticatedFetch(`${this.baseUrl}?id=${id}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      logger.debug('Usuario obtenido', data);
      
      return data;
    } catch (error) {
      logger.error('Error obteniendo usuario', error);
      throw error;
    }
  }

  // Crear nuevo usuario
  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      logger.debug('Creando usuario', { email: userData.email, role: userData.role });
      
      const response = await authService.authenticatedFetch(this.baseUrl, {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      logger.info('Usuario creado exitosamente', { id: data.id, email: data.email });
      
      return data;
    } catch (error) {
      logger.error('Error creando usuario', error);
      throw error;
    }
  }

  // Actualizar usuario existente
  async updateUser(id: number, userData: UpdateUserRequest): Promise<User> {
    try {
      logger.debug('Actualizando usuario', { id, changes: Object.keys(userData) });
      
      const response = await authService.authenticatedFetch(`${this.baseUrl}?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      logger.info('Usuario actualizado exitosamente', { id, email: data.email });
      
      return data;
    } catch (error) {
      logger.error('Error actualizando usuario', error);
      throw error;
    }
  }

  // Cambiar estado (activar/desactivar) usuario
  async toggleUserStatus(id: number): Promise<User> {
    try {
      logger.debug('Cambiando estado de usuario', { id });
      
      const response = await authService.authenticatedFetch(this.baseUrl, {
        method: 'PATCH',
        body: JSON.stringify({ 
          id, 
          action: 'toggle_status' 
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      logger.info('Estado de usuario cambiado', { id, active: data.active });
      
      return data;
    } catch (error) {
      logger.error('Error cambiando estado de usuario', error);
      throw error;
    }
  }

  // Eliminar usuario (soft delete)
  async deleteUser(id: number): Promise<void> {
    try {
      logger.debug('Eliminando usuario', { id });
      
      const response = await authService.authenticatedFetch(`${this.baseUrl}?id=${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      logger.info('Usuario eliminado exitosamente', { id });
    } catch (error) {
      logger.error('Error eliminando usuario', error);
      throw error;
    }
  }

  // Buscar usuarios por término
  async searchUsers(term: string): Promise<User[]> {
    try {
      logger.debug('Buscando usuarios', { term });
      
      const response = await authService.authenticatedFetch(`${this.baseUrl}?search=${encodeURIComponent(term)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      logger.debug('Usuarios encontrados', { count: data.length, term });
      
      return data;
    } catch (error) {
      logger.error('Error buscando usuarios', error);
      throw error;
    }
  }

  // Obtener estadísticas de usuarios
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<User['role'], number>;
  }> {
    try {
      logger.debug('Obteniendo estadísticas de usuarios');
      
      const response = await authService.authenticatedFetch(`${this.baseUrl}?action=stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      logger.debug('Estadísticas obtenidas', data);
      
      return data;
    } catch (error) {
      logger.error('Error obteniendo estadísticas', error);
      throw error;
    }
  }

  // Validar permisos de usuario actual
  async validatePermissions(action: string, targetUserId?: number): Promise<boolean> {
    try {
      const currentUser = authService.getUserFromToken();
      
      if (!currentUser) {
        return false;
      }

      // Solo admins pueden gestionar otros usuarios
      if (currentUser.role !== 'admin') {
        // Los usuarios pueden editar su propio perfil
        return targetUserId === currentUser.sub;
      }

      return true;
    } catch (error) {
      logger.error('Error validando permisos', error);
      return false;
    }
  }
}

// Crear instancia singleton
export const usersService = new UsersService();

// Hook personalizado para React (opcional)
export const useUsers = () => {
  return {
    getUsers: usersService.getUsers.bind(usersService),
    getUser: usersService.getUser.bind(usersService),
    createUser: usersService.createUser.bind(usersService),
    updateUser: usersService.updateUser.bind(usersService),
    toggleUserStatus: usersService.toggleUserStatus.bind(usersService),
    deleteUser: usersService.deleteUser.bind(usersService),
    searchUsers: usersService.searchUsers.bind(usersService),
    getUserStats: usersService.getUserStats.bind(usersService),
    validatePermissions: usersService.validatePermissions.bind(usersService),
  };
};