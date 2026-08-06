import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  server: {
    port: 4202,
    strictPort: true
  },
  preview: {
    port: 4202,
    strictPort: true
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        admin: resolve(__dirname, "admin/index.html")
      }
    }
  }
});
