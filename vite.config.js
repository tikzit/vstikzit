import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(), 
    nodePolyfills()
  ],
  assetsInclude: ['**/*.svg'],
  build: {
    lib: {
      entry: './src/gui/index.tsx',
      name: 'webview',
      fileName: "webview",
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        manualChunks: undefined,
      }
    }
  },
  worker: {
    format: 'es'
  },
  optimizeDeps: {
    include: ['monaco-editor/esm/vs/editor/editor.api']
  }
});