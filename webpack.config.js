/* eslint-env node */

const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: [
    './src/index.js',
  ],
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'dist'),
    publicPath: '/',
  },
  module: {
    preLoaders: [{
      test: /\.json$/,
      loader: 'json',
    }],
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel?presets[]=es2015&presets[]=react',
    }, {
      test: /\.css$/,
      loader: 'style!css',
    }, {
      test: /\.(png|jpg)$/,
      loader: 'url?limit=8192',
    }],
  },
  plugins: [
    new webpack.ProvidePlugin({
      fetch: 'imports?this=>global!exports?global.fetch!whatwg-fetch',
      Promise: 'imports?this=>global!exports?global.Promise!es6-promise',
    }),
    new webpack.DefinePlugin({ 'process.env.NODE_ENV': '"production"' }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        screw_ie8: true,
        warnings: false,
      },
      mangle: {
        screw_ie8: true,
      },
      output: {
        comments: false,
        screw_ie8: true,
      },
    }),
  ],
};
