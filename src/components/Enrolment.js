import React, { Component } from 'react';
import numeral from 'numeral';
import { sumBy } from 'lodash';

class Enrolment extends Component {
  constructor(...args) {
    super(...args);
    this.state = {
      data: null,
      loading: true,
    };
  }

  componentDidMount() {
    fetch('/enrolment')
      .then(response => response.json())
      .then(json => this.setState({
        data: json,
        loading: false,
      }));
  }

  render() {
    const { data, loading } = this.state;
    const TOTAL = 93;

    if (loading) {
      return (
        <div className="figures">
          Loading...
        </div>
      );
    }

    const avgCurrent = sumBy(data, 'current') / TOTAL;
    const avgFuture = sumBy(data, 'future') / TOTAL;

    return (
      <div className="figures">
        <table className="figures-table">
          <thead>
            <tr>
              <th>District</th>
              <th>Current</th>
              <th>+/-</th>
              <th></th>
              <th>Future</th>
              <th>+/-</th>
            </tr>
          </thead>
          <tbody>
            {data.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td style={{ textAlign: 'right' }}>
                  {numeral(item.current).format('0,0')}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {numeral(100 * (item.current - avgCurrent) / avgCurrent).format('0.00')}%
                </td>
                <td>&nbsp;</td>
                <td style={{ textAlign: 'right' }}>
                  {numeral(item.future).format('0,0')}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {numeral(100 * (item.future - avgFuture) / avgFuture).format('0.00')}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

export default Enrolment;
