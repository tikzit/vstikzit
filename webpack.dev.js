const { merge } = require('webpack-merge');
const { extensionConfig, webviewConfig } = require('./webpack.common.js');

const developmentConfig = {
  mode: 'development',
  devtool: 'source-map',
  output: {
    clean: false,
  },
  optimization: {
    minimize: false,
  },
  infrastructureLogging: {
    level: 'warn',
  },
};

module.exports = [
  merge(extensionConfig, developmentConfig),
  merge(webviewConfig, developmentConfig),
];
