import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { apiProxy } from './dev/proxy';
export default defineConfig({
  plugins: [react()],
  build: { target: "es2022" },
  server: { proxy: { "/api": apiProxy('http://127.0.0.1:8788') } },
});
