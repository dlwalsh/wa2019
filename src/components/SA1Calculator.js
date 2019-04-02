import React, { Component } from 'react';
import sumBy from 'lodash/sumBy';

class SA1Calculator extends Component {
  constructor(...args) {
    super(...args);
    this.state = {
      data: {},
      entries: [''],
    };
  }

  componentDidMount() {
    fetch('/data/sa1.geojson')
      .then(response => response.json())
      .then(json => {
        this.setState({
          data: json.features.reduce(
            (memo, feat) => Object.assign(memo, {
              [feat.properties.SA1]: {
                current: feat.properties.actual,
                projected: feat.properties.projected,
              },
            })
          , {}),
        });
      });
  }

  addEntry() {
    const { entries } = this.state;
    this.setState({
      entries: [...entries, ''],
    });
  }

  updateEntry(index, value) {
    const { entries } = this.state;
    this.setState({
      entries: [
        ...entries.slice(0, index),
        value.trim(),
        ...entries.slice(index + 1),
      ],
    });
  }

  render() {
    const { data, entries } = this.state;

    const totalCurrent = sumBy(entries, e => data[e] && data[e].current || 0);
    const totalProjected = sumBy(entries, e => data[e] && data[e].projected || 0);

    return (
      <div>
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
              <td>{totalCurrent}</td>
              <td>{totalProjected}</td>
            </tr>
          </tfoot>
          <tbody>
            {entries.map((entry, i) => (
              <tr key={i}>
                <td>
                  <input
                    type="text"
                    value={entry}
                    onChange={e => this.updateEntry(i, e.target.value)}
                  />
                </td>
                <td>{data[entry] && data[entry].current}</td>
                <td>{data[entry] && data[entry].projected}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div>
          <button type="button" onClick={() => this.addEntry()}>
            Add Row
          </button>
        </div>
      </div>
    );
  }
}

export default SA1Calculator;
