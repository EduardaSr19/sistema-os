import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Em dev, encaminha /api para o backend local — sem CORS
      "/api": {
        target: "http://localhost:3333",
        changeOrigin: true,
      },
    },
  },
  build: {
    // Avisa se algum chunk passar de 600 kB
    chunkSizeWarningLimit: 600,
  },
});
