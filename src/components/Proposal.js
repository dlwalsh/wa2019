import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import React, { Component } from 'react';
import * as topojson from 'topojson';

class Proposal extends Component {
  constructor(...args) {
    super(...args);
    this.state = {
      geodata: null,
      loading: true,
    };
  }

  componentDidMount() {
    // fetch('//uniformswing.com/geodata/qld/redistributions/qld2016-mock.json')
    fetch('/data/redistribution.topojson')
      .then(response => response.json())
      .then(json => this.setState({
        geodata: json,
        loading: false,
      }));
  }

  componentDidUpdate(prevProps, prevState) {
    const { geodata } = this.state;
    if (geodata !== prevState.geodata) {
      this.loadMap(geodata);
    }
  }

  loadMap(data) {
    const map = L.map(this.mapRef, {
      center: [-35, 138],
      zoom: 7,
    });

    L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    L.geoJson(topojson.feature(data, data.objects.districts), {
      style: {
        color: 'red',
        fillOpacity: 0,
        opacity: 0.25,
        weight: 3,
      },
    }).addTo(map);

    L.geoJson(topojson.feature(data, data.objects.lga), {
      style: {
        color: 'green',
        fillOpacity: 0,
        opacity: 0.25,
        weight: 2,
      },
    }).addTo(map);

    L.geoJson(topojson.feature(data, data.objects.proposal), {
      style: {
        color: '#0066ff',
        fillOpacity: 0,
        opacity: 1,
        weight: 2,
      },
      onEachFeature(feature, layer) {
        const infoStr = Object.keys(feature.properties)
          .map(prop => `${prop}: ${feature.properties[prop]}`)
          .join('<br>');

        layer.bindPopup(infoStr).addEventListener('popupopen', () => {
          layer.setStyle({ fillOpacity: 0.25 });
        }).addEventListener('popupclose', () => {
          layer.setStyle({ fillOpacity: 0 });
        });
      },
    }).addTo(map);
  }

  render() {
    const { loading } = this.state;

    return (
      <div className="container">
        <div
          className="map"
          ref={(ref) => {
            this.mapRef = ref;
          }}
        >
          {loading && 'Loading...'}
        </div>
      </div>
    );
  }
}

export default Proposal;
