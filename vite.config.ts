import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === "extension") {
    // Extension-only build
    return {
      build: {
        lib: {
          entry: resolve(__dirname, "src/extension/extension.ts"),
          name: "extension",
          fileName: "extension",
          formats: ["es"],
        },
        outDir: "dist",
        emptyOutDir: false,
        rollupOptions: {
          external: ["vscode", "path", "child_process", "fs", "util", "events", "stream"],
        },
        target: "node16",
      },
      plugins: [],
    };
  } else {
    // Webview-only build (default)
    return {
      build: {
        lib: {
          entry: resolve(__dirname, "src/gui/index.tsx"),
          name: "webview",
          fileName: "webview",
          formats: ["es"],
        },
        outDir: "dist",
        emptyOutDir: false,
        assetsInlineLimit: 16384,
      },
      assetsInclude: ["**/*.svg"],
      plugins: [react()],
      define: {
        "process.env.NODE_ENV": '"production"',
      },
    };
  }
});
