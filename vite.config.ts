import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import checker from "vite-plugin-checker";
import svgr from "vite-plugin-svgr";

const NamedChunks = {
  react: ["react", "react-dom"],
  material: ["@emotion/styled", "@mui/material", "@mui/icons-material"],
  rxjs: ["rxjs", "scheduler"],
  lodash: ["lodash"],
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svgr(),
    react(),
    checker({ typescript: { root: ".", tsconfigPath: "./tsconfig.json" } }),
  ],

  base: "/catalogue/",

  resolve: {
    alias: {
      "@": "/src",
    },
  },

  // FIXME: This breaks production build with a cryptic error message.
  // build: {
  //   rollupOptions: {
  //     output: {
  //       manualChunks: (id) => {
  //         if (id.includes("/node_modules/")) {
  //           // Check explicit groups
  //           for (const [name, modules] of Object.entries(NamedChunks)) {
  //             if (modules.some((x) => id.includes(`/node_modules/${x}/`))) {
  //               return name;
  //             }
  //           }

  //           // Everything else from node_modules is vendor
  //           return "vendor";
  //         }
  //       },
  //     },
  //   },
  // },

  server: {
    port: 8080,
  },
});
