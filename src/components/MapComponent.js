import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { setupUserLocationsListener, trackUserLocation } from './UserLocationService';
import QuestsComponent from './QuestsComponent';
import 'mapbox-gl/dist/mapbox-gl.css';
import Quests from './Quests';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoia3lpbTUwIiwiYSI6ImNsempkdjZibDAzM2MybXE4bDJmcnZ6ZGsifQ.-ie6lQO1TWYrL8c6h2W41g';
mapboxgl.accessToken = MAPBOX_TOKEN;

const MapComponent = ({ address, setAddress, setCurrentUserIds, setMap }) => {
  const mapContainerRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentUserIds, setLocalCurrentUserIds] = useState([]);

  useEffect(() => {
    if (!mapInstance) {
      const newMap = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/kyim50/clzniqnmq009s01qgee0a13s0',
        center: [0, 0],
        zoom: 2,
        attributionControl: false,
      });

      newMap.on('load', () => {
        setMapLoaded(true);
        setMapInstance(newMap);
        setMap(newMap);
      });
    }

    return () => {
      if (mapInstance) mapInstance.remove();
    };
  }, [mapInstance, setMap]);

  useEffect(() => {
    let unsubscribe;
    if (mapLoaded && mapInstance) {
      trackUserLocation(mapInstance, setAddress);
      unsubscribe = setupUserLocationsListener(mapInstance, (ids) => {
        setLocalCurrentUserIds(ids);
        setCurrentUserIds(ids);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [mapLoaded, mapInstance, setAddress, setCurrentUserIds]);

  

  const handleQuestAccepted = async (quest) => {
    if (mapInstance && quest.senderLocation) {
      const { lng, lat } = quest.senderLocation;
      mapInstance.flyTo({ center: [lng, lat], zoom: 14 });

      const route = await getRouteToSender(mapInstance, quest.senderLocation);
      if (route) {
        const routeLayerId = `route-${quest.id}`;
        if (mapInstance.getLayer(routeLayerId)) {
          mapInstance.removeLayer(routeLayerId);
          mapInstance.removeSource(routeLayerId);
        }

        mapInstance.addLayer({
          id: routeLayerId,
          type: 'line',
          source: {
            type: 'geojson',
            data: route,
          },
          layout: {
            'line-join': 'round',
            'line-cap': 'round',
          },
          paint: {
            'line-color': '#888',
            'line-width': 8,
          },
        });
      }
    }
  };

  const getRouteToSender = async (map, senderLocation) => {
    const userLocation = map.getCenter();
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLocation.lng},${userLocation.lat};${senderLocation.lng},${senderLocation.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        return data.routes[0].geometry;
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
    return null;
  };

  return (
    <>
      <div ref={mapContainerRef} className="map-placeholder" style={{ width: '100%', height: '100%' }}></div>
      <div className="address-bar" id="address-bar">{address}</div>
      {mapInstance && <QuestsComponent map={mapInstance} currentUserIds={currentUserIds} onQuestAccepted={handleQuestAccepted} />}
    </>
  );
};

export default MapComponent;