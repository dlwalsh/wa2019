/* eslint no-console: 0 */

const path = require('path');
const express = require('express');
const webpack = require('webpack');
const devMiddleware = require('webpack-dev-middleware');
const hotMiddleware = require('webpack-hot-middleware');
const config = require('./webpack.config');
const enrolment = require('./enrolment');

const app = express();
const compiler = webpack(config);

app.use(devMiddleware(compiler, {
  noInfo: true,
  publicPath: config.output.publicPath,
}));

app.use(hotMiddleware(compiler));

['/', '/calculator', '/proposal'].forEach((endpoint) => {
  app.get(endpoint, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });
});

app.get('/enrolment', (req, res) => {
  enrolment((err, output) => {
    if (err) {
      console.log(err);
    } else {
      res.end(JSON.stringify(output, null, 4));
    }
  });
});

app.get('/data/:resource', (req, res) => {
  res.sendFile(path.join(__dirname, 'data', req.params.resource));
});

app.listen(5000, 'localhost', (err) => {
  if (err) {
    console.log(err);
    return;
  }

  console.log('Listening at http://localhost:5000');
});
