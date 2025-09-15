# Configuración del Sistema de Login con JWT

## Requisitos Previos

1. **Servidor con PHP 7.4+**
2. **Base de datos MySQL**
3. **Composer instalado**
4. **Extensión PHP JWT**

## Instalación

### 1. Instalar dependencias PHP

```bash
cd /var/www/MERCANTIL/alfredpay-compliance\ 2/alfredpay-compliance/
composer require firebase/php-jwt
```

### 2. Configurar base de datos

1. Ejecuta el archivo `database/users.sql` en tu base de datos MySQL:
```sql
mysql -u tu_usuario -p tu_base_de_datos < database/users.sql
```

2. Edita `api/config.php` con tus credenciales de base de datos:
```php
$host = 'localhost';
$dbname = 'alfredpay_compliance'; // Tu base de datos
$username = 'tu_usuario';         // Tu usuario MySQL
$password = 'tu_contraseña';      // Tu contraseña MySQL
$jwt_secret = 'TU_CLAVE_SECRETA_UNICA'; // Cambia por una clave única y segura
```

### 3. Configurar servidor web

Si usas Apache, crea un archivo `.htaccess` en la carpeta `api/`:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ $1.php [QSA,L]

# Permitir CORS
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET,POST,PUT,DELETE,OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type,Authorization"
```

### 4. Configurar el frontend

En el archivo `src/services/auth.ts`, verifica que la URL del API sea correcta:

```typescript
const API_BASE_URL = '/api'; // Ajusta según tu configuración
```

## Usuarios de Prueba

El sistema viene con usuarios de prueba (contraseña: `123456`):

- **admin@alfredpay.com** - Administrador
- **compliance@alfredpay.com** - Oficial de Cumplimiento  
- **analyst@alfredpay.com** - Analista

## Estructura de Archivos

```
api/
├── config.php           # Configuración de BD y JWT
├── login.php           # Endpoint de autenticación
└── validate_token.php  # Validación de tokens

src/
├── components/
│   └── LoginScreen.tsx # Componente de login
├── services/
│   └── auth.ts         # Servicio de autenticación
└── App.tsx            # App principal actualizada

database/
└── users.sql          # Script de creación de tablas
```

## Configuración de Producción

### Seguridad

1. **Cambia la clave JWT** en `api/config.php`
2. **Usa HTTPS** en producción
3. **Configura CORS** apropiadamente en `$allowed_origins`
4. **Usa variables de entorno** para credenciales sensibles

### Variables de Entorno (Recomendado)

Crea un archivo `.env` (no incluir en Git):

```env
DB_HOST=localhost
DB_NAME=alfredpay_compliance
DB_USER=tu_usuario
DB_PASS=tu_contraseña
JWT_SECRET=tu_clave_jwt_super_secreta
```

## Funcionalidades Implementadas

✅ **Login con email y contraseña**
✅ **Generación de JWT tokens**
✅ **Validación de tokens**
✅ **Persistencia de sesión (localStorage)**
✅ **Logout automático**
✅ **Manejo de errores**
✅ **CORS configurado**
✅ **Roles de usuario**

## Uso

1. El usuario introduce email y contraseña
2. El frontend envía credenciales a `/api/login.php`
3. PHP valida credenciales y genera JWT
4. Frontend guarda el token y redirige al dashboard
5. Todas las peticiones posteriores incluyen el token en el header `Authorization: Bearer <token>`

## Solución de Problemas

### Error de CORS
- Verifica que `$allowed_origins` incluya tu dominio
- Asegúrate de que el servidor web permita headers CORS

### Error de JWT
- Verifica que `firebase/php-jwt` esté instalado correctamente
- Confirma que `$jwt_secret` sea la misma en todas partes

### Error de Base de Datos
- Verifica credenciales en `config.php`
- Asegúrate de que la tabla `users` exista
- Confirma que el usuario de BD tenga permisos

### Token expirado
- Los tokens expiran en 24 horas por defecto
- Modifica `'exp' => time() + (24 * 60 * 60)` en `login.php` para cambiar la duración