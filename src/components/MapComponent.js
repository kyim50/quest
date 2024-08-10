import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { setupUserLocationsListener, trackUserLocation } from './UserLocationService';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoia3lpbTUwIiwiYSI6ImNsempkdjZibDAzM2MybXE4bDJmcnZ6ZGsifQ.-ie6lQO1TWYrL8c6h2W41g';
mapboxgl.accessToken = MAPBOX_TOKEN;

const MapComponent = ({ address, setAddress }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentUserIds, setCurrentUserIds] = useState([]);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/kyim50/clzniqnmq009s01qgee0a13s0',
        center: [0, 0],
        zoom: 2
      });

      mapRef.current.on('load', () => {
        setMapLoaded(true);
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    let unsubscribe;
    if (mapLoaded && mapRef.current) {
      trackUserLocation(mapRef.current, setAddress);
      unsubscribe = setupUserLocationsListener(mapRef.current, setCurrentUserIds);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [mapLoaded, mapRef.current]);

  return (
    <>
      <div ref={mapContainerRef} className="map-placeholder" style={{ width: '100%', height: '100%' }}></div>
      <div className="address-bar" id="address-bar">{address}</div>
    </>
  );
};

export default MapComponent;
