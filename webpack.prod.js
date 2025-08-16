const { merge } = require('webpack-merge');
const { extensionConfig, webviewConfig } = require('./webpack.common.js');

const productionConfig = {
  mode: 'production',
  optimization: {
    minimize: true,
  },
};

module.exports = [
  merge(extensionConfig, productionConfig),
  merge(webviewConfig, productionConfig),
];
