import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import checker from "vite-plugin-checker";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), checker({ typescript: true })],

  base: "/catalogue/",

  resolve: {
    alias: {
      "@": "/src",
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          ui: [
            "@emotion/styled",
            "@mui/material",
            "@mui/icons-material",
            "@tanstack/react-table",
            "@tanstack/react-virtual",
          ],
        },
      },
    },
  },

  server: {
    port: 8080,
  },
});
