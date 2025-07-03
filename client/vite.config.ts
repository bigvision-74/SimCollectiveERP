import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    commonjsOptions: {
      include: ["tailwind.config.js", "node_modules/**"],
    },
  },
  optimizeDeps: {
    include: ["tailwind-config"],
  },
  plugins: [react()],
  resolve: {
    alias: {
      'simplebar/dist/simplebar.css': path.resolve(__dirname, 'node_modules/simplebar/dist/simplebar.css'),
      '@firebaseConfig': path.resolve(__dirname, 'firebaseConfig'),
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "tailwind-config": fileURLToPath(
        new URL("./tailwind.config.js", import.meta.url)
      ),
    },
  },
});
