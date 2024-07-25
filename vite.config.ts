import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import checker from "vite-plugin-checker";
import svgr from "vite-plugin-svgr";

const NamedChunks = {
  // These packages can create cirular references, so we need to give them their own files
  shared: ["scheduler", "loose-envify", "js-tokens", "object-assign"],
  "css-utils": ["clsx", "csstype"],
  "babel-runtime": ["@babel/runtime"],
  // End circular reference group
  react: ["react", "react-dom", "react-is", "prop-types"],
  emotion: ["@emotion"],
  mui: ["@mui", "@popperjs/core"],
  rxjs: ["rxjs"],
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

  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("/node_modules/")) {
            // Check explicit groups
            for (const [name, modules] of Object.entries(NamedChunks)) {
              if (modules.some((x) => id.includes(`/node_modules/${x}/`))) {
                return name;
              }
            }

            // Everything else from node_modules is vendor
            return "vendor";
          }
        },
      },
    },
  },

  server: {
    port: 8080,
  },
});
