/* eslint no-console: 0 */

const async = require('async');
const fs = require('fs');
const turf = require('@turf/turf');
const numeral = require('numeral');
const path = require('path');
const _ = require('lodash');

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
    console.log(`Processing ${district.name}...`);

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

    let geography;
    try {
      geography = turf.union(...districtFeatures);
    } catch (e) {
      cb(`union failed for ${district.name}: ${e.message}`);
    }

    const area = turf.area(geography) / 1000000;
    const current = _.sumBy(districtFeatures, f => parseInt(f.properties.Electors, 10) || 0);
    const phantom = area > 1000000 ? current * 1.6 : 0;

    const properties = _.pickBy({
      Name: district.name,
      Area: `${numeral(Math.floor(area)).format('0,0')} sq km`,
      Actual: numeral(current).format('0,0'),
      Phantom: phantom,
      Total: current + phantom,
    });

    cb(null, Object.assign(geography, { properties }));
  }, (err, data) => {
    if (err) {
      throw err;
    }
    const geojson = turf.featureCollection(data);
    const missing = Object.keys(features).filter(k => !features[k].count);
    const duplicates = Object.keys(features).filter(k => features[k].count > 1);

    if (missing.length > 0) {
      console.log('Missing SA1s\n', missing.join('\n'));
    }
    if (duplicates.length > 0) {
      console.log('Duplicate SA1s\n', duplicates.join('\n'));
    }

    const outFileName = path.join(__dirname, 'data/proposal.geojson');
    fs.writeFile(outFileName, JSON.stringify(geojson), (writeError) => {
      if (writeError) {
        console.error(writeError);
      } else {
        console.log('Contents written to', outFileName);
      }
    });
  });
});
