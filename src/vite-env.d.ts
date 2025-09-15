/// <reference types="vite/client" />

// ===============================
//  Variables de entorno Vite (TS)
//  - Solo las que empiezan por VITE_
//  - Acceso: import.meta.env.VITE_*
// ===============================
interface ImportMetaEnv {
  readonly VITE_BASE?: string;      // p.ej. "/hub/"
  readonly VITE_API_URL?: string;   // URL de backend si aplica
  readonly VITE_APP_NAME?: string;  // Nombre de app
  // Agrega aquí otras VITE_* que uses…
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// ===============================
//  Tipos para importar assets
//  (Vite ya soporta esto, pero lo tipamos explícito)
// ===============================
declare module "*.svg" {
  const src: string;
  export default src;
}
declare module "*.png" {
  const src: string;
  export default src;
}
declare module "*.jpg" {
  const src: string;
  export default src;
}
declare module "*.jpeg" {
  const src: string;
  export default src;
}
declare module "*.gif" {
  const src: string;
  export default src;
}
declare module "*.webp" {
  const src: string;
  export default src;
}
