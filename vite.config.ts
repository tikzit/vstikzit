import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        webview: resolve(__dirname, "src/gui/index.tsx"),
        extension: resolve(__dirname, "src/extension/extension.ts"),
      },
      output: {
        dir: "dist",
        entryFileNames: "[name].js",
        format: "es", // ES modules format
        chunkFileNames: "chunks/[name]-[hash].js",
      },
      external: (id, importer) => {
        // Only externalize vscode and Node.js built-ins for the extension bundle
        if (importer?.includes("extension.ts")) {
          if (id === "vscode") return true;
          if (["path", "child_process", "fs", "util", "events", "stream"].includes(id)) return true;
        }
        return false;
      },
    },
    target: ["es2020", "node16"], // Support both browser and Node.js
    assetsInlineLimit: 16384,
  },
  assetsInclude: ["**/*.svg"],
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
