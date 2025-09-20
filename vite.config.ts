import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
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
  } else if (mode === "test") {
    // unit test build
    return {
      build: {
        lib: {
          entry: resolve(__dirname, "src/test/main.test.ts"),
          name: "tests",
          fileName: "tests",
          formats: ["es"],
        },
        outDir: "dist",
        emptyOutDir: false,
        target: "node16",
      },
      plugins: [],
    };
  } else if (mode === "webview") {
    return {
      build: {
        lib: {
          entry: resolve(__dirname, "src/gui/TikzitExtensionHost.tsx"),
          name: "tikzit_vscode",
          fileName: "tikzit_vscode",
          formats: ["es"],
        },
        outDir: "dist",
        emptyOutDir: false,
        assetsInlineLimit: 16384,
      },
      assetsInclude: ["**/*.svg"],
      plugins: [preact()],
      define: {
        "process.env.NODE_ENV": '"production"',
      },
    };
  } else {
    // Browser build by default
    return {
      build: {
        outDir: "dist",
        emptyOutDir: false,
        assetsInlineLimit: 16384,
      },
      assetsInclude: ["**/*.svg"],
      plugins: [preact()],
      define: {
        "process.env.NODE_ENV": '"production"',
      },
    };
  }
});
