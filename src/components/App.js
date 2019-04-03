import React, { Component } from 'react';
import Enrolment from './Enrolment';
import Map from './Map';
import Selections from './Selections';

class App extends Component {
  constructor(...args) {
    super(...args);
    this.state = {
      entries: [],
    };
  }

  addEntry(entry) {
    this.setState(state => ({
      entries: [...state.entries, entry].sort(),
    }));
  }

  clearEntries() {
    this.setState({
      entries: [],
    });
  }

  removeEntry(entry) {
    this.setState(state => ({
      entries: state.entries.filter(e => e !== entry),
    }));
  }

  render() {
    const { entries } = this.state;

    return (
      <div className="container">
        <Map
          addEntry={entry => this.addEntry(entry)}
          entries={entries}
          removeEntry={entry => this.removeEntry(entry)}
        />
        <div className="sidebar">
          <Selections
            clearEntries={() => this.clearEntries()}
            entries={entries}
          />
        </div>
      </div>
    );
  }
}

export default App;
