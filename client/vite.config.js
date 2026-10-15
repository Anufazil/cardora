import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
export default defineConfig({
  plugins: [react(), tailwind()],
  resolve: { preserveSymlinks: true },
  server: {
    port: 4380,
    proxy: {
      "/api": "http://127.0.0.1:4381",
      "/media": "http://127.0.0.1:4381",
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    include: ["src/**/*.test.{js,jsx}"],
  },
});
