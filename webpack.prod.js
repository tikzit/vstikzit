const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
const path = require('path');

// Extension configuration
const extensionConfig = merge(common, {
  mode: 'production',
  target: 'node',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
  },
  optimization: {
    minimize: true,
  },
});

// Webview configuration
const webviewConfig = merge(common, {
  mode: 'production',
  target: 'web',
  entry: './src/gui/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'webview.js',
  },
  optimization: {
    minimize: true,
  },
  resolve: {
    ...common.resolve,
    fallback: {
      path: false,
      fs: false,
    },
  },
  plugins: [
    new MonacoWebpackPlugin({
      // Available options are documented at https://github.com/Microsoft/monaco-editor-webpack-plugin#options
      languages: [], // We're using custom tikz language, so no built-in languages needed
      features: ['!gotoSymbol', '!hover', '!contextmenu', '!quickCommand'], // exclude features to reduce bundle size
    }),
  ],
});

module.exports = [extensionConfig, webviewConfig];
