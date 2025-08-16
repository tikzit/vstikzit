const webpack = require('webpack');
const config = require('./webpack.dev.js'); // Use dev config instead of watch config

console.log('Starting webpack in watch mode...');

const compiler = webpack(config);

const watching = compiler.watch({
  ignored: /node_modules/,
  poll: 1000,
  aggregateTimeout: 300,
}, (err, stats) => {
  if (err) {
    console.error(err);
    return;
  }

  console.log(stats.toString({
    chunks: false,
    colors: true,
    modules: false,
    assets: false,
    timings: true,
    errors: true,
    warnings: true
  }));
});

process.on('SIGINT', () => {
  console.log('Stopping webpack watch...');
  watching.close(() => {
    console.log('Webpack watch stopped.');
    process.exit(0);
  });
});
