// vite.config.ts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(function (_a) {
    var command = _a.command, mode = _a.mode;
    // Cargar variables de entorno basadas en el modo
    var env = loadEnv(mode, process.cwd(), '');
    return {
        // Base path dinámico basado en el entorno
        base: mode === 'production' ? "/hub/" : "/",
        plugins: [react()],
        // Configuración del servidor de desarrollo
        server: {
            port: 5173,
            host: true, // Para permitir acceso desde la red local
        },
        // Configuración para el build
        build: {
            outDir: 'dist',
            sourcemap: mode !== 'production',
        },
        // Variables de entorno adicionales si es necesario
        define: {
            __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
        },
    };
});
