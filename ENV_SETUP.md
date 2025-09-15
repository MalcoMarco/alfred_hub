# Configuración de Variables de Entorno

## Descripción General

El proyecto utiliza variables de entorno para configurar diferentes aspectos según el entorno (desarrollo, staging, producción). Esto permite cambiar fácilmente URLs de APIs, configuraciones de debug, y otros parámetros sin modificar el código.

## Archivos de Configuración

### Variables Disponibles

| Variable | Descripción | Ejemplo | Requerida |
|----------|-------------|---------|-----------|
| `VITE_API_BASE_URL` | URL base del backend API | `https://mi-dominio.com/api` | ✅ |
| `VITE_APP_NAME` | Nombre de la aplicación | `AlfredPay Compliance` | ❌ |
| `VITE_APP_VERSION` | Versión de la aplicación | `1.0.0` | ❌ |
| `VITE_DEBUG_MODE` | Activar logs de debug | `true` o `false` | ❌ |

### Archivos de Entorno

#### `.env.local` (Desarrollo Local)
```env
# Variables para desarrollo local
VITE_API_BASE_URL=http://localhost/alfredpay-compliance/api
VITE_APP_NAME=AlfredPay Compliance (Dev)
VITE_APP_VERSION=1.0.0-dev
VITE_DEBUG_MODE=true
```

#### `.env.production` (Producción)
```env
# Variables para producción
VITE_API_BASE_URL=https://tu-dominio.com/api
VITE_APP_NAME=AlfredPay Compliance
VITE_APP_VERSION=1.0.0
VITE_DEBUG_MODE=false
```

#### `.env.example` (Plantilla)
Archivo de ejemplo que no contiene valores reales y puede ser incluido en Git.

## Configuración por Entorno

### Desarrollo Local

1. **Copia el archivo de ejemplo:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edita las variables según tu configuración:**
   ```env
   # Para XAMPP/WAMP
   VITE_API_BASE_URL=http://localhost/tu-proyecto/api
   
   # Para servidor PHP incorporado
   VITE_API_BASE_URL=http://localhost:8000/api
   
   # Para desarrollo con puerto específico
   VITE_API_BASE_URL=http://localhost:3001/api
   ```

3. **Ejecuta en modo desarrollo:**
   ```bash
   npm run dev
   ```

### Producción en cPanel

#### Opción 1: Archivo .env.production
1. **Crea/edita `.env.production` en el servidor:**
   ```env
   VITE_API_BASE_URL=https://tu-dominio.com/hub/api
   VITE_APP_NAME=AlfredPay Compliance
   VITE_DEBUG_MODE=false
   ```

2. **Build para producción:**
   ```bash
   npm run build
   ```

#### Opción 2: Variables en tiempo de build
```bash
# Build con variables específicas
VITE_API_BASE_URL=https://tu-dominio.com/api npm run build
```

### Staging/Testing
```env
VITE_API_BASE_URL=https://staging.tu-dominio.com/api
VITE_APP_NAME=AlfredPay Compliance (Staging)
VITE_DEBUG_MODE=true
```

## Estructura de URLs Comunes

### Desarrollo Local
- **XAMPP Windows**: `http://localhost/alfredpay-compliance/api`
- **WAMP**: `http://localhost/alfredpay-compliance/api`
- **MAMP (Mac)**: `http://localhost:8888/alfredpay-compliance/api`
- **Servidor PHP incorporado**: `http://localhost:8000/api`

### Producción
- **Dominio principal**: `https://tu-dominio.com/api`
- **Subdirectorio**: `https://tu-dominio.com/hub/api`
- **Subdominio**: `https://api.tu-dominio.com`
- **cPanel con ruta específica**: `https://tu-dominio.com/public_html/api`

## Comandos de Build

```bash
# Desarrollo con archivo .env.local
npm run dev

# Build para producción con .env.production
npm run build

# Build con variables específicas (sobrescribe archivo)
VITE_API_BASE_URL=https://mi-api.com npm run build

# Preview del build de producción
npm run preview
```

## Validación de Configuración

El proyecto incluye validación automática de variables requeridas:

```typescript
import { validateConfig } from './src/config';

// Verificar configuración
const errors = validateConfig();
if (errors.length > 0) {
  console.error('Errores de configuración:', errors);
}
```

## Debug y Logging

Cuando `VITE_DEBUG_MODE=true`, se activan logs adicionales:

```javascript
// En la consola del navegador verás:
[DEBUG] [AuthService] Intentando login { email: "user@example.com", apiUrl: "..." }
[INFO] Configuración cargada { mode: "development", apiBaseUrl: "..." }
```

## Seguridad

### ⚠️ Importantes Consideraciones de Seguridad

1. **Variables públicas**: Todas las variables `VITE_*` son **públicas** y accesibles desde el navegador
2. **No incluir secretos**: Nunca pongas claves secretas, passwords, o tokens en variables `VITE_*`
3. **Archivos sensibles**: Añade archivos con datos reales a `.gitignore`

### Archivo .gitignore recomendado
```gitignore
# Variables de entorno locales
.env.local
.env.development.local
.env.test.local
.env.production.local

# Variables con datos reales (si las usas)
.env.staging
.env.prod
```

## Solución de Problemas

### Error: "Cannot connect to API"
1. Verifica que `VITE_API_BASE_URL` esté configurada correctamente
2. Confirma que el servidor backend esté ejecutándose
3. Revisa que no haya problemas de CORS

### Variables no se cargan
1. Asegúrate de que las variables empiecen con `VITE_`
2. Reinicia el servidor de desarrollo después de cambios en .env
3. Verifica que el archivo .env esté en la raíz del proyecto

### Build de producción no funciona
1. Confirma que tengas `.env.production` o pases variables al comando build
2. Verifica las URLs en producción (HTTPS vs HTTP)
3. Revisa la configuración del servidor web para rutas de API

## Ejemplo Completo de Configuración

### Desarrollo (.env.local)
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=AlfredPay Compliance (Local)
VITE_APP_VERSION=1.0.0-dev
VITE_DEBUG_MODE=true
```

### Producción (.env.production)
```env
VITE_API_BASE_URL=https://compliance.alfredpay.com/api
VITE_APP_NAME=AlfredPay Compliance
VITE_APP_VERSION=1.0.0
VITE_DEBUG_MODE=false
```

### Commands
```bash
# Desarrollo
npm run dev

# Build para producción  
npm run build

# Deploy a servidor
rsync -av dist/ user@server:/var/www/html/
```