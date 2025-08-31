import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  build: {
    lib: {
      entry: "./src/gui/index.tsx",
      name: "webview",
      fileName: "webview",
      formats: ["es"],
    },
  },
  assetsInclude: ["**/*.svg"],
  plugins: [react()],
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
