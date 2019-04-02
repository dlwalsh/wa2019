/* eslint no-console: 0 */

const async = require('async');
const fs = require('fs');
const numeral = require('numeral');
const path = require('path');
const _ = require('lodash');

function formatRow(title, fig1, fig2) {
  return _.join([
    _.padEnd(title, 40),
    _.padStart(fig1, 12),
    _.padStart(fig2, 12),
  ], '');
}

async.parallel({
  proposal(cb) {
    fs.readFile(path.join(__dirname, 'data/proposal.json'), cb);
  },
  geodata(cb) {
    fs.readFile(path.join(__dirname, 'data/sa1.geojson'), cb);
  },
}, (error, results) => {
  if (error) {
    throw error;
  }

  const proposal = JSON.parse(results.proposal);
  const geodata = JSON.parse(results.geodata);

  const features = geodata.features.reduce((memo, feat) => {
    const id = feat.properties.cd_id;
    return Object.assign(memo, {
      [id]: memo[id] ? [...memo[id], feat] : [feat],
    });
  }, {});

  async.map(proposal.districts, (district, cb) => {
    const districtFeatures = district.SA1.reduce((memo, pairs) => {
      const [start, end] = pairs;

      if (end && end - start >= 100) {
        cb(`Invalid pair: ${start} ${end}`);
      }
      const set = _.range(start, (end || start) + 1).map((x) => {
        if (!features[x]) {
          cb(`Invalid SA1: ${x}`);
        } else {
          features[x].count = (features[x].count || 0) + 1;
        }
        return features[x];
      });
      const flatSet = _.flatten(set);

      return [...memo, ...flatSet];
    }, []);

    const featuresByOrigin = _.groupBy(districtFeatures, 'properties.elect_div');

    const current = _.sumBy(districtFeatures, 'properties.actual');
    const projected = _.sumBy(districtFeatures, 'properties.projected');

    console.log(formatRow(district.name, 'Actual', 'Projected'));
    _.sortBy(_.entries(featuresByOrigin), '0').forEach(([key, feat]) => {
      const originName = key.slice(0, 2) === 'Mc' ? key.slice(0, 2) + _.capitalize(key.slice(2)) : key;
      const currentByOrigin = _.sumBy(feat, 'properties.actual');
      const projectedByOrigin = _.sumBy(feat, 'properties.projected');
      if (currentByOrigin !== 0 && projectedByOrigin !== 0) {
        console.log(formatRow(
          `from ${originName}`,
          numeral(currentByOrigin).format('0,0'),
          numeral(projectedByOrigin).format('0,0'),
        ));
      }
    });
    console.log(formatRow('Total', numeral(current).format('0,0'), numeral(projected).format('0,0')));
    console.log('');

    const properties = _.pickBy({
      name: district.name,
      current,
      projected,
    });

    cb(null, properties);
  }, (err, data) => {
    if (err) {
      throw err;
    }

    const totalCurrent = _.sumBy(data, 'current');
    const totalFuture = _.sumBy(data, 'projected');

    console.log(formatRow(
      'Grand Total',
      numeral(totalCurrent).format('0,0'),
      numeral(totalFuture).format('0,0'),
    ));

    const missing = Object.keys(features).filter(k => !features[k].count);

    if (missing.length > 0) {
      console.log('Missing SA1s\n', missing.join('\n'));
    }

    const duplicates = Object.keys(features).filter(k => features[k].count > 1);

    if (duplicates.length > 0) {
      console.log('Duplicate SA1s\n', duplicates.join('\n'));
    }
  });
});
