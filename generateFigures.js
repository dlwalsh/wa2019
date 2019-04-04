/* eslint no-console: 0 */

const async = require('async');
const fs = require('fs');
const numeral = require('numeral');
const path = require('path');
const papa = require('papaparse');
const _ = require('lodash');
const turf = require('@turf/turf');

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
  figures(cb) {
    fs.readFile(path.join(__dirname, 'data/sa1.csv'), cb);
  },
  geometry(cb) {
    fs.readFile(path.join(__dirname, 'data/proposal.geojson'), cb);
  },
}, (error, results) => {
  if (error) {
    throw error;
  }

  const proposal = JSON.parse(results.proposal);
  const { data: figures } = papa.parse(results.figures.toString());
  const { features } = JSON.parse(results.geometry);

  const areas = features.reduce((memo, f) => ({
    ...memo,
    [f.properties.Name]: turf.area(f) / 1000000,
  }), {});

  const enrolment = figures.reduce((memo, row) => {
    const id = row[5];
    const electors = parseInt(row[6], 10);
    return Object.assign(memo, {
      [id]: memo[id] ? memo[id] + electors : electors,
    });
  }, {});

  async.map(proposal.districts, (district, cb) => {
    const electors = district.SA1.reduce((memo, pairs) => {
      const [start, end] = pairs;

      if (end && end - start >= 100) {
        cb(`Invalid pair: ${start} ${end}`);
      }
      const set = _.range(start, (end || start) + 1).map(x =>
        // if (!enrolment[x]) {
        //   cb(`Invalid SA1: ${x}`);
        // // } else {
        // //   features[x].count = (features[x].count || 0) + 1;
        // }
        enrolment[x] || 0);

      const flatSet = _.flatten(set);

      return [...memo, ...flatSet];
    }, []);

    // const featuresByOrigin = _.groupBy(districtFeatures, 'properties.District');
    //
    // console.log(featuresByOrigin);

    const current = _.sum(_.values(electors));
    const area = areas[district.name];
    const phantom = area > 100000 ? area * 0.015 : 0;

    console.log(formatRow(district.name, 'Actual', 'Area', 'Phantom', 'Total'));
    // _.sortBy(_.entries(featuresByOrigin), '0').forEach(([key, feat]) => {
    //   const originName = key.slice(0, 2) === 'Mc' ? key.slice(0, 2) + _.capitalize(key.slice(2)) : key;
    //   const electorsByOrigin = _.sumBy(feat, f => parseInt(f.properties.Electors, 10) || 0);
    //   const areaByOrigin = _.sumBy(feat, f => parseFloat(f.properties.AREASQKM16) || 0);
    //
    //   if (electorsByOrigin !== 0 && areaByOrigin !== 0) {
    //     console.log(formatRow(
    //       `from ${originName}`,
    //       numeral(electorsByOrigin).format('0,0'),
    //       numeral(areaByOrigin).format('0,0'),
    //     ));
    //   }
    // });

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
      console.error(err);
      process.exit(1);
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

    // const missing = Object.keys(features).filter(k => !features[k].count);
    //
    // if (missing.length > 0) {
    //   console.log('Missing SA1s\n', missing.join('\n'));
    // }
    //
    // const duplicates = Object.keys(features).filter(k => features[k].count > 1);
    //
    // if (duplicates.length > 0) {
    //   console.log('Duplicate SA1s\n', duplicates.join('\n'));
    // }
  });
});
