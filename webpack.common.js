const path = require('path');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

// Base configuration shared by both extension and webview
const baseConfig = {
  output: {
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  resolve: {
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
        use: {
          loader: 'ts-loader',
          options: {
            compilerOptions: {
              module: 'esnext',
              moduleResolution: 'node',
              esModuleInterop: true,
              allowSyntheticDefaultImports: true,
            },
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  externals: {
    vscode: 'commonjs vscode', // Important for VS Code extensions
  },
};

// Extension-specific configuration
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

// Webview-specific configuration  
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
      languages: ['json'],
      features: ['!gotoSymbol', '!hover', '!contextmenu', '!quickCommand'],
    }),
  ],
};

module.exports = { extensionConfig, webviewConfig };
