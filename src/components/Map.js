import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import React, { Component, PropTypes } from 'react';
import * as topojson from 'topojson';

const propTypes = {
  addEntry: PropTypes.func.isRequired,
  entries: PropTypes.array.isRequired,
  removeEntry: PropTypes.func.isRequired,
};

class Map extends Component {
  constructor(...args) {
    super(...args);
    this.state = {
      geodata: null,
      loading: true,
    };
  }

  componentDidMount() {
    fetch('/data/sa.topojson')
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

  onLayerClick(id, layer) {
    const {
      addEntry,
      entries,
      removeEntry,
    } = this.props;

    if (entries.includes(id)) {
      removeEntry(id);
      layer.setStyle({ fillOpacity: 0 });
    } else {
      addEntry(id);
      layer.setStyle({ fillOpacity: 0.25 });
    }
  }

  loadMap(data) {
    const component = this;
    const map = L.map(this.mapRef, {
      center: [-35, 138],
      zoom: 7,
    });
    const areaGeo = topojson.feature(data, data.objects.sa1);
    const districtGeo = topojson.feature(data, data.objects.districts);
    const lgaGeo = topojson.feature(data, data.objects.lga);

    L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    L.geoJson(districtGeo, {
      style: {
        color: '#0099ff',
        fillOpacity: 0,
        weight: 3,
      },
    }).addTo(map);

    L.geoJson(lgaGeo, {
      style: {
        color: '#00ff00',
        fillOpacity: 0,
        weight: 2,
      },
    }).addTo(map);

    L.geoJson(areaGeo, {
      style: {
        color: 'red',
        fillOpacity: 0,
        weight: 1,
      },
      onEachFeature(feature, layer) {
        const { properties } = feature;
        layer.addEventListener('click', () => component.onLayerClick(properties.cd_id, layer));
      },
      filter(feature) {
        return true;
      },
    }).addTo(map);
  }

  render() {
    const { loading } = this.state;

    return (
      <div
        className="map"
        ref={(ref) => {
          this.mapRef = ref;
        }}
      >
        {loading && 'Loading...'}
      </div>
    );
  }
}

Map.propTypes = propTypes;

export default Map;
