import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    proxy: {
      "/divisions": "http://127.0.0.1:8000",
      "/division": "http://127.0.0.1:8000",
      "/faqs": "http://127.0.0.1:8000",
      "/stats": "http://127.0.0.1:8000",
      "/unanswered": "http://127.0.0.1:8000",
      "/upload": "http://127.0.0.1:8000",
      "/admin": "http://127.0.0.1:8000",
      "/api": "http://127.0.0.1:8000",
    },
  },
  preview: {
    port: 4173,
    host: true,
    proxy: {
      "/divisions": "http://127.0.0.1:8000",
      "/division": "http://127.0.0.1:8000",
      "/faqs": "http://127.0.0.1:8000",
      "/stats": "http://127.0.0.1:8000",
      "/unanswered": "http://127.0.0.1:8000",
      "/upload": "http://127.0.0.1:8000",
      "/admin": "http://127.0.0.1:8000",
      "/api": "http://127.0.0.1:8000",
    },
  },
});
