# Sistema de Gestión de Usuarios - Documentación

## Descripción General

El sistema de gestión de usuarios permite administrar usuarios, roles y permisos en la aplicación AlfredPay Compliance. Ha sido separado en un componente modular e independiente con funcionalidad completa CRUD.

## Arquitectura

### Frontend
- **`components/UsersRolesPage.tsx`** - Componente principal de interfaz
- **`services/users.ts`** - Servicio para operaciones CRUD
- **`services/auth.ts`** - Autenticación y permisos

### Backend
- **`api/users.php`** - Endpoint REST para todas las operaciones
- **`api/config.php`** - Configuración y utilidades compartidas

### Base de Datos
- **`database/users.sql`** - Schema y datos de prueba

## Funcionalidades

### ✅ Implementadas

1. **Listar Usuarios**
   - Vista de tabla con información completa
   - Estados visual (activo/inactivo)
   - Badges de roles con colores

2. **Crear Usuario**
   - Formulario modal validado
   - Campos: nombre, apellido, email, rol, contraseña
   - Validación de email único

3. **Editar Usuario**
   - Actualización de todos los campos
   - Contraseña opcional (mantiene actual si está vacía)
   - Validaciones del lado servidor

4. **Cambiar Estado**
   - Activar/desactivar usuarios
   - Actualización inmediata en la interfaz

5. **Sistema de Permisos**
   - Basado en roles de usuario
   - Validación en frontend y backend

6. **Logging y Debug**
   - Logs detallados de operaciones
   - Manejo de errores centralizado

## Roles y Permisos

| Rol | Ver Usuarios | Crear | Editar | Cambiar Estado | Eliminar |
|-----|-------------|--------|---------|----------------|----------|
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Compliance Officer** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Analyst** | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Viewer** | ❌ | ❌ | ❌ | ❌ | ❌ |

### Excepciones
- Los usuarios pueden ver/editar su propio perfil independientemente del rol
- Compliance Officers pueden ver la lista de usuarios pero no modificarlos

## API Endpoints

### GET `/api/users.php`
Listar todos los usuarios

**Respuesta:**
```json
[
  {
    "id": 1,
    "email": "admin@alfredpay.com",
    "firstName": "Admin",
    "lastName": "AlfredPay",
    "role": "admin",
    "active": true,
    "createdAt": "2025-09-14 10:00:00",
    "updatedAt": "2025-09-14 10:00:00",
    "lastLogin": "2025-09-14 15:30:00"
  }
]
```

### GET `/api/users.php?id={id}`
Obtener usuario específico

### GET `/api/users.php?search={term}`
Buscar usuarios por nombre o email

### GET `/api/users.php?action=stats`
Obtener estadísticas de usuarios

### POST `/api/users.php`
Crear nuevo usuario

**Body:**
```json
{
  "email": "nuevo@example.com",
  "firstName": "Nombre",
  "lastName": "Apellido", 
  "role": "analyst",
  "password": "contraseña123"
}
```

### PUT `/api/users.php?id={id}`
Actualizar usuario existente

### PATCH `/api/users.php`
Operaciones específicas (cambiar estado)

**Body:**
```json
{
  "id": 1,
  "action": "toggle_status"
}
```

### DELETE `/api/users.php?id={id}`
Eliminar usuario (soft delete)

## Instalación y Configuración

### 1. Base de Datos
```sql
-- Ejecutar el script
mysql -u usuario -p base_datos < database/users.sql
```

### 2. Dependencias PHP
```bash
composer require firebase/php-jwt
```

### 3. Configuración
Actualiza `api/config.php` con tus credenciales:
```php
$host = 'localhost';
$dbname = 'tu_base_datos';
$username = 'tu_usuario';
$password = 'tu_contraseña';
```

### 4. Variables de Entorno
En `.env.local`:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_DEBUG_MODE=true
```

## Usuarios de Prueba

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@alfredpay.com | 123456 | Admin |
| compliance@alfredpay.com | 123456 | Compliance Officer |
| analyst@alfredpay.com | 123456 | Analyst |
| pilar@alfredpay.com | 123456 | Analyst |

## Uso del Componente

### Integración en App.tsx
```tsx
import UsersRolesPage from "./components/UsersRolesPage";

// En el componente principal
{active === "users" && <UsersRolesPage />}
```

### Uso del Servicio
```tsx
import { usersService } from "../services/users";

// Obtener usuarios
const users = await usersService.getUsers();

// Crear usuario
const newUser = await usersService.createUser({
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  role: "viewer",
  password: "password123"
});
```

## Desarrollo y Testing

### Comandos Útiles

```bash
# Desarrollo frontend
npm run dev

# Servidor PHP de desarrollo
php -S localhost:8000 -t api/

# Verificar configuración
./check-env.sh development
```

### Debug y Logs

Con `VITE_DEBUG_MODE=true` verás logs en consola:
```
[DEBUG] [AuthService] Intentando login
[DEBUG] Usuarios cargados { count: 4 }
[INFO] Usuario creado exitosamente { id: 5, email: "..." }
```

### Testing Manual

1. **Login como admin** → Deberías ver todos los controles
2. **Crear usuario** → Modal se abre, validaciones funcionan
3. **Editar usuario** → Formulario pre-poblado
4. **Cambiar estado** → Usuario se activa/desactiva inmediatamente
5. **Login como compliance officer** → Solo puedes ver usuarios
6. **Login como analyst** → No tienes acceso al módulo

## Seguridad

### Validaciones Implementadas

- **Frontend:** Validación de formularios, tipos TypeScript
- **Backend:** Sanitización de entrada, validación de permisos
- **Base de Datos:** Constraints, campos únicos

### Consideraciones

- Las contraseñas se hashean con `password_hash()` (bcrypt)
- Tokens JWT verificados en cada petición
- Permisos validados en frontend Y backend
- Soft delete (no se eliminan físicamente los usuarios)

## Próximas Funcionalidades

### 🔄 Pendientes

- [ ] Paginación para listas grandes
- [ ] Filtros avanzados (por rol, estado, fecha)
- [ ] Exportar usuarios a CSV/Excel
- [ ] Historial de cambios (audit log)
- [ ] Resetear contraseña por email
- [ ] Múltiples roles por usuario
- [ ] Permisos granulares por módulo

### 🚀 Mejoras Sugeridas

- [ ] Tests unitarios y de integración
- [ ] Componente reutilizable para otros módulos
- [ ] Optimización de queries con índices
- [ ] Cache de usuarios frecuentes
- [ ] Notificaciones push para cambios

## Solución de Problemas

### Error 403 "Sin permisos"
- Verificar rol del usuario logueado
- Confirmar que el token no haya expirado
- Revisar permisos en `api/users.php`

### Error de conexión
- Verificar que el servidor PHP esté corriendo
- Confirmar URL en variables de entorno
- Revisar configuración CORS

### Usuarios no se cargan
- Verificar estructura de la tabla `users`
- Confirmar datos de conexión en `config.php`
- Revisar logs en consola del navegador

## Contacto y Soporte

Para reportar bugs o solicitar funcionalidades, utilizar el sistema de issues del proyecto.