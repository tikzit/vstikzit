import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import monacoEditorPlugin from 'vite-plugin-monaco-editor';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [react(), nodePolyfills(), monacoEditorPlugin({languageWorkers:[]})],
  assetsInclude: ['**/*.svg'],
  build: {
    lib: {
      entry: './src/gui/index.tsx',
      name: 'webview',
      fileName: "webview",
      formats: ['es'],
    },
  },
});