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
    fetch('/data/sa1.geojson')
      .then(response => response.json())
      .then(json => {
        this.setState({
          data: json.features.reduce(
            (memo, feat) => Object.assign(memo, {
              [feat.properties.cd_id]: {
                current: feat.properties.actual,
                district: feat.properties.elect_div,
                projected: feat.properties.projected,
              },
            })
          , {}),
        });
      });
  }

  render() {
    const { clearEntries, entries } = this.props;
    const { data } = this.state;

    const groupedEntries = groupBy(entries, e => data[e] && data[e].district);
    const totalCurrent = sumBy(entries, e => data[e] && data[e].current || 0);
    const totalProjected = sumBy(entries, e => data[e] && data[e].projected || 0);

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
              <th>Projected</th>
            </tr>
          </thead>
          <tfoot>
            <tr>
              <td>Total</td>
              <td style={{ textAlign: 'right' }}>
                {totalCurrent}
              </td>
              <td style={{ textAlign: 'right' }}>
                {totalProjected}
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
                    {data[entry] && data[entry].current}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {data[entry] && data[entry].projected}
                  </td>
                </tr>
              ))}
              <tr>
                <td>Subtotal</td>
                <td style={{ textAlign: 'right' }}>
                  {sumBy(groupedEntries[group], e => data[e] && data[e].current || 0)}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {sumBy(groupedEntries[group], e => data[e] && data[e].projected || 0)}
                </td>
              </tr>
            </tbody>
          ))}
        </table>
        <div style={{ display: 'none', position: 'absolute', top: '5px', right: '10px' }}>
          <button type="button" onClick={clearEntries}>
            Clear all
          </button>
        </div>
        <div>
          <h3>Summary</h3>
          <pre>
            [{'\n'}
            {summary.map(pair => `  [${pair.join(', ')}],\n`)}
            ]
          </pre>
        </div>
      </div>
    );
  }
}

Selections.propTypes = propTypes;

export default Selections;
