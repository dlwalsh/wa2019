/* eslint no-console: 0 */

const async = require('async');
const fs = require('fs');
const numeral = require('numeral');
const path = require('path');
const _ = require('lodash');

function formatRow(title, ...figures) {
  return _.join([
    _.padEnd(title, 40),
    ...figures.map(fig => _.padStart(fig, 12)),
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
    const id = feat.properties.SA1_7DIG16;
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

    const featuresByOrigin = _.groupBy(districtFeatures, 'properties.District');

    const current = _.sumBy(districtFeatures, f => parseInt(f.properties.Electors, 10) || 0);
    const area = _.sumBy(districtFeatures, f => parseFloat(f.properties.AREASQKM16) || 0);
    const phantom = area > 100000 ? area * 0.015 : 0;

    console.log(formatRow(district.name, 'Actual', 'Area', 'Phantom', 'Total'));
    _.sortBy(_.entries(featuresByOrigin), '0').forEach(([key, feat]) => {
      const originName = key.slice(0, 2) === 'Mc' ? key.slice(0, 2) + _.capitalize(key.slice(2)) : key;
      const electorsByOrigin = _.sumBy(feat, f => parseInt(f.properties.Electors, 10) || 0);
      const areaByOrigin = _.sumBy(feat, f => parseFloat(f.properties.AREASQKM16) || 0);
      const phantomByOrigin = areaByOrigin > 100000 ? areaByOrigin * 0.015 : 0;

      if (electorsByOrigin !== 0 && areaByOrigin !== 0) {
        console.log(formatRow(
          `from ${originName}`,
          numeral(electorsByOrigin).format('0,0'),
          numeral(areaByOrigin).format('0,0'),
          numeral(phantomByOrigin).format('0,0'),
          numeral(electorsByOrigin + phantomByOrigin).format('0,0'),
        ));
      }
    });
    console.log(formatRow(
      'Total',
      numeral(current).format('0,0'),
      numeral(area).format('0,0'),
      numeral(phantom).format('0,0'),
      numeral(current + phantom).format('0,0'),
    ));
    console.log('');

    const properties = _.pickBy({
      name: district.name,
      current,
      area,
      phantom,
      total: current + phantom,
    });

    cb(null, properties);
  }, (err, data) => {
    if (err) {
      throw err;
    }

    const totalCurrent = _.sumBy(data, 'current');
    const totalArea = _.sumBy(data, 'area');
    const totalPhantom = _.sumBy(data, 'phantom');
    const totalTotal = _.sumBy(data, 'total');

    console.log(formatRow(
      'Grand Total',
      numeral(totalCurrent).format('0,0'),
      numeral(totalArea).format('0,0'),
      numeral(totalPhantom).format('0,0'),
      numeral(totalTotal).format('0,0'),
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
