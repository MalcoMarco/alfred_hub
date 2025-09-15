// Tipos para las variables de entorno de Vite
// Esto proporciona autocompletado y verificación de tipos

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_DEBUG_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Declarar la variable global para TypeScript
declare const __APP_VERSION__: string;