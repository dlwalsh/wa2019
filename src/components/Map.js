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
    fetch('/data/sa1.geojson')
      .then(response => response.json())
      .then(json => this.setState({
        geodata: json,
        loading: false,
      }));
    fetch('/data/lga.geojson')
      .then(response => response.json())
      .then(json => this.setState({
        lgaGeo: json,
        loading: false,
      }));
  }

  componentDidUpdate(prevProps, prevState) {
    const { geodata, lgaGeo } = this.state;
    if (geodata !== prevState.geodata || lgaGeo !== prevState.lgaGeo) {
      this.loadMap(geodata, lgaGeo);
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

  loadMap(data, lgaGeo) {
    const component = this;

    if (!this.map) {
      this.map = L.map(this.mapRef, {
        center: [-27, 121],
        zoom: 5,
      });
      L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(this.map);
    }
    // const areaGeo = topojson.feature(data, data.objects.sa1);
    // const districtGeo = topojson.feature(data, data.objects.districts);
    // const lgaGeo = topojson.feature(data, data.objects.lga);

    // L.geoJson(districtGeo, {
    //   style: {
    //     color: '#0099ff',
    //     fillOpacity: 0,
    //     weight: 3,
    //   },
    // }).addTo(map);

    L.geoJson(lgaGeo, {
      style: {
        color: '#00ff00',
        fillOpacity: 0,
        weight: 2,
      },
    }).addTo(this.map);

    L.geoJson(data, {
      style: {
        color: 'red',
        fillOpacity: 0,
        weight: 1,
      },
      onEachFeature(feature, layer) {
        const { properties } = feature;
        layer.addEventListener('click', () => component.onLayerClick(properties.SA1_7DIG16, layer));
      },
      filter(feature) {
        const sa4 = parseInt(feature.properties.SA4_CODE16, 10) || 0;

        return sa4 >= 503 && sa4 <= 507;
      },
    }).addTo(this.map);
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
