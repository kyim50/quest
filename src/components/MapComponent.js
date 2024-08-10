import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { setupUserLocationsListener, trackUserLocation } from './UserLocationService';
import QuestsComponent from './QuestsComponent';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoia3lpbTUwIiwiYSI6ImNsempkdjZibDAzM2MybXE4bDJmcnZ6ZGsifQ.-ie6lQO1TWYrL8c6h2W41g';
mapboxgl.accessToken = MAPBOX_TOKEN;

const MapComponent = ({ address, setAddress }) => {
  const mapContainerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentUserIds, setCurrentUserIds] = useState([]);

  useEffect(() => {
    if (!map) {
      const newMap = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/kyim50/clzniqnmq009s01qgee0a13s0',
        center: [0, 0],
        zoom: 2
      });

      newMap.on('load', () => {
        setMapLoaded(true);
        setMap(newMap);
      });
    }

    return () => {
      if (map) map.remove();
    };
  }, [map]);

  useEffect(() => {
    let unsubscribe;
    if (mapLoaded && map) {
      trackUserLocation(map, setAddress);
      unsubscribe = setupUserLocationsListener(map, setCurrentUserIds);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [mapLoaded, map, setAddress]);

  return (
    <>
      <div ref={mapContainerRef} className="map-placeholder" style={{ width: '100%', height: '100%' }}></div>
      <div className="address-bar" id="address-bar">{address}</div>
      {map && <QuestsComponent map={map} currentUserIds={currentUserIds} />}
    </>
  );
};

export default MapComponent;