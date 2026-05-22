import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Tauri expects the dev server on a fixed port and ignores src-tauri on watch.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    target: "es2022",
    outDir: "dist",
    sourcemap: true,
  },
});
