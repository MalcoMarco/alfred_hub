// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
    base: "/hub/", // porque sirves el sitio bajo /hub/
    plugins: [react()],
});
