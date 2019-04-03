import React, { Component, PropTypes } from 'react';
import groupBy from 'lodash/groupBy';
import sumBy from 'lodash/sumBy';

const propTypes = {
  clearEntries: PropTypes.func.isRequired,
  entries: PropTypes.array.isRequired,
};

class Selections extends Component {
  constructor(...args) {
    super(...args);
    this.state = {
      data: {},
    };
  }

  componentDidMount() {
    fetch('/data/wa.geojson')
      .then(response => response.json())
      .then((json) => {
        this.setState({
          data: json.features.reduce(
            (memo, feat) => Object.assign(memo, {
              [feat.properties.SA1_7DIG16]: {
                electors: parseInt(feat.properties.Electors, 10),
                district: feat.properties.District,
                area: parseFloat(feat.properties.AREASQKM16),
              },
            })
            , {},
          ),
        });
      });
  }

  render() {
    const { clearEntries, entries } = this.props;
    const { data } = this.state;

    const groupedEntries = groupBy(entries, e => data[e] && data[e].district);
    const totalCurrent = sumBy(entries, e => data[e] && data[e].electors || 0);
    const totalArea = sumBy(entries, e => data[e] && data[e].area || 0);

    const summary = entries
      .map(x => parseInt(x, 10))
      .reduce((memo, item, index, array) => {
        if (index > 0 && item === array[index - 1] + 1) {
          return [
            ...memo.slice(0, memo.length - 1), [
              memo[memo.length - 1][0],
              item,
            ],
          ];
        }
        return [
          ...memo,
          [item],
        ];
      }, []);

    return (
      <div className="selections">
        <table>
          <thead>
            <tr>
              <th>SA1</th>
              <th>Current</th>
              <th>Area</th>
            </tr>
          </thead>
          <tfoot>
            <tr>
              <td>Total</td>
              <td style={{ textAlign: 'right' }}>
                {totalCurrent}
              </td>
              <td style={{ textAlign: 'right' }}>
                {totalArea.toFixed(3)}
              </td>
            </tr>
          </tfoot>
          {Object.keys(groupedEntries).map(group => (
            <tbody key={group}>
              <tr>
                <th colSpan="3">District {group}</th>
              </tr>
              {groupedEntries[group].map(entry => (
                <tr key={entry}>
                  <td>{entry}</td>
                  <td style={{ textAlign: 'right' }}>
                    {data[entry] && data[entry].electors}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {data[entry] && data[entry].area.toFixed(3)}
                  </td>
                </tr>
              ))}
              <tr>
                <td>Subtotal</td>
                <td style={{ textAlign: 'right' }}>
                  {sumBy(groupedEntries[group], e => data[e] && data[e].electors || 0)}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {sumBy(groupedEntries[group], e => data[e] && data[e].area || 0).toFixed(3)}
                </td>
              </tr>
            </tbody>
          ))}
        </table>
        <div
          style={{
            display: 'none', position: 'absolute', top: '5px', right: '10px',
          }}
        >
          <button type="button" onClick={clearEntries}>
            Clear all
          </button>
        </div>
        <div>
          <h3>Summary</h3>
          <pre>
            {'\n'}
            {summary.map(pair => `  [${pair.join(', ')}],\n`)}
          </pre>
        </div>
      </div>
    );
  }
}

Selections.propTypes = propTypes;

export default Selections;
