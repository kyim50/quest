import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { addMarker, clearMarkers } from './UserLocationService';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoia3lpbTUwIiwiYSI6ImNsempkdjZibDAzM2MybXE4bDJmcnZ6ZGsifQ.-ie6lQO1TWYrL8c6h2W41g';
mapboxgl.accessToken = MAPBOX_TOKEN;

const MapComponent = ({ address, setAddress }) => {
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!mapRef.current) {
      const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/dark-v10',
        center: [0, 0],
        zoom: 2
      });
      mapRef.current = map;

      map.on('load', () => {
        // Initialize map-related functionality
      });
    }
  }, []);

  // ... (include other map-related functions like updateUserLocation, displayAllUserMarkers, etc.)

  return (
    <>
      <div id="map" className="map-placeholder"></div>
      <div className="address-bar" id="address-bar">{address}</div>
    </>
  );
};

export default MapComponent;
