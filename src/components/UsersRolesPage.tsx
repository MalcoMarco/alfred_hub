import React, { useState, useEffect } from "react";
import { config, logger } from "../config";
import { authService } from "../services/auth";
import { usersService, User } from "../services/users";

interface NewUser {
  email: string;
  firstName: string;
  lastName: string;
  role: User['role'];
  password: string;
}

const Card: React.FC<React.PropsWithChildren<{ 
  title?: string; 
  className?: string;
  right?: React.ReactNode;
}>> = ({ title, className = "", right, children }) => (
  <div className={`rounded-2xl border border-gray-200 bg-white p-4 md:p-5 ${className}`}>
    {(title || right) && (
      <div className="mb-3 flex items-center justify-between">
        {title ? <h3 className="font-semibold text-gray-900">{title}</h3> : <div />}
        {right ?? null}
      </div>
    )}
    {children}
  </div>
);

const Badge: React.FC<{ 
  variant: 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
}> = ({ variant, children }) => {
  const variants = {
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800", 
    danger: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800"
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};

const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

const UsersRolesPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<NewUser>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'ceo',
    password: ''
  });

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await usersService.getUsers();
      setUsers(data);
      logger.debug('Usuarios cargados', data);
    } catch (err: any) {
      logger.error('Error cargando usuarios', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      
      if (editingUser) {
        // Actualizar usuario existente
        await usersService.updateUser(editingUser.id, formData);
      } else {
        // Crear nuevo usuario
        await usersService.createUser(formData);
      }
      
      await loadUsers(); // Recargar lista
      setIsModalOpen(false);
      setEditingUser(null);
      resetForm();
      
      logger.info(`Usuario ${editingUser ? 'actualizado' : 'creado'} exitosamente`);
    } catch (err: any) {
      logger.error('Error guardando usuario', err);
      setError(err.message);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      password: '' // No pre-llenar password
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (userId: number) => {
    try {
      await usersService.toggleUserStatus(userId);
      await loadUsers();
      logger.info('Estado del usuario cambiado exitosamente');
    } catch (err: any) {
      logger.error('Error cambiando estado', err);
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'ceo',
      password: ''
    });
  };

  const handleNewUser = () => {
    setEditingUser(null);
    resetForm();
    setIsModalOpen(true);
  };

  const getRoleLabel = (role: User['role']): string => {
    const labels = {
      admin: 'Administrador',
      compliance_officer: 'Oficial de Cumplimiento',
      ceo: 'CEO',
      ops_vp: 'VPS/VP',
    };
    return labels[role];
  };

  const getRoleBadgeVariant = (role: User['role']) => {
    const variants = {
      admin: 'danger' as const,
      compliance_officer: 'info' as const,
      ceo: 'info' as const,
      ops_vp: 'info' as const,
    };
    return variants[role];
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card title="Usuarios & Roles">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Cargando usuarios...</span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card 
        title="Usuarios & Roles"
        right={
          <button
            onClick={handleNewUser}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            Nuevo Usuario
          </button>
        }
      >
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="overflow-auto rounded-lg border">
          <table className="min-w-[800px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Usuario</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Rol</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Último Login</th>
                <th className="px-4 py-3 text-right font-medium text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.active ? 'success' : 'danger'}>
                        {user.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {user.lastLogin 
                        ? new Date(user.lastLogin).toLocaleDateString()
                        : 'Nunca'
                      }
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user.id)}
                        className={`text-sm font-medium ${
                          user.active 
                            ? 'text-red-600 hover:text-red-800'
                            : 'text-green-600 hover:text-green-800'
                        }`}
                      >
                        {user.active ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal para crear/editar usuario */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Apellido
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rol
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value as User['role']})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="viewer">Visualizador</option>
              <option value="analyst">Analista</option>
              <option value="compliance_officer">Oficial de Cumplimiento</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
            </label>
            <input
              type="password"
              required={!editingUser}
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={editingUser ? "Dejar vacío para mantener actual" : ""}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              {editingUser ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersRolesPage;