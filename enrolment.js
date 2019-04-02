const async = require('async');
const fs = require('fs');
const path = require('path');

function enrolment(callback) {
  fs.readFile(path.join(__dirname, 'data/sa1.geojson'), 'utf8', (error, content) => {
    if (error) {
      callback(error);
    }

    const sa1Data = JSON.parse(content);

    async.reduce(sa1Data.features, {}, (memo, item, cb) => {
      const {
        elect_div: id,
        actual: current,
        projected: future,
      } = item.properties;

      const intermediate = Object.assign({}, memo, {
        [id]: {
          current: memo[id] ? memo[id].current + current : current,
          future: memo[id] ? memo[id].future + future : future,
        },
      });

      process.nextTick(() => cb(null, intermediate));
    }, (err, figures) => {
      callback(null, Object.keys(figures).map(id => Object.assign({
        id,
        name: id,
      }, figures[id])));
    });
  });
}

module.exports = enrolment;
