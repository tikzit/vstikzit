//@ts-check

'use strict';

const webpack = require('webpack');
const path = require('path');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

const baseConfig = {
	mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, 'dist'),
    pathinfo: false,
  },
  externals: {
    vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    // modules added here also need to be added in the .vscodeignore file
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    extensionAlias: {
      '.js': ['.js', '.ts'],
      '.cjs': ['.cjs', '.cts'],
      '.mjs': ['.mjs', '.mts']
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true
            }
          }
        ]
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.ttf$|.svg$/,
        type: 'asset/resource',
      },
    ]
  },
  devtool: 'nosources-source-map',
  // devtool: 'eval-cheap-module-source-map',
  infrastructureLogging: {
    level: "log", // enables logging required for problem matchers
  },
};

const extensionConfig = {
  ...baseConfig,
  target: 'node',
  entry: './src/extension.ts',
  output: {
    ...baseConfig.output,
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
  },
};

const webviewConfig = {
  ...baseConfig,
  target: 'web',
  entry: './src/gui/index.tsx',
  output: {
    ...baseConfig.output,
    filename: 'webview.js',
  },
  resolve: {
    ...baseConfig.resolve,
    fallback: {
      path: false,
      fs: false,
    },
  },
  plugins: [
    new MonacoWebpackPlugin({
      languages: [],
      features: [
          '!bracketMatching',
          '!caretOperations',
          'clipboard',
          '!codeAction',
          '!codelens',
          '!comment',
          '!contextmenu',
          '!gotoSymbol',
          '!hover',
          '!quickCommand'],
    }),
  new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ],
};

const testConfig = {
  ...baseConfig,
  target: 'node',
  entry: './src/test/main.test.ts',
  output: {
    ...baseConfig.output,
    filename: 'test.js',
    libraryTarget: 'commonjs2',
  },
};

module.exports = [ extensionConfig, webviewConfig, testConfig ];