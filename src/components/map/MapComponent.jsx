import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { setupUserLocationsListener, trackUserLocation, centerMapOnUser } from './UserLocationService';
import QuestsComponent from '../QuestsComponent';
import { getCurrentTheme, initializeTheme } from '../../theme-toggle';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoia3lpbTUwIiwiYSI6ImNsempkdjZibDAzM2MybXE4bDJmcnZ6ZGsifQ.-ie6lQO1TWYrL8c6h2W41g';
mapboxgl.accessToken = MAPBOX_TOKEN;

const darkMapStyle = 'mapbox://styles/kyim50/clzniqnmq009s01qgee0a13s0'; // Your current dark style
const lightMapStyle = 'mapbox://styles/mapbox/light-v10'; // Example light style, replace with your custom light style if you have one

const MapComponent = ({ address, setAddress, setCurrentUserIds, setMap, activeSection, lockedUser, showAddressBar, isFullScreen }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentUserIds, setLocalCurrentUserIds] = useState([]);
  const markersRef = useRef({});

  const initializeMap = useCallback(() => {
    if (!mapInstanceRef.current) {
      const savedState = JSON.parse(localStorage.getItem('mapState'));
      const currentTheme = getCurrentTheme();
      mapInstanceRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: currentTheme === 'light' ? lightMapStyle : darkMapStyle,
        center: savedState?.center || [0, 0],
        zoom: savedState?.zoom || 2,
        attributionControl: false,
      });

      mapInstanceRef.current.on('load', () => {
        setMapLoaded(true);
        setMap(mapInstanceRef.current);
        window.currentMap = mapInstanceRef.current; // Store map instance globally for theme-toggle.js
      });

      mapInstanceRef.current.on('moveend', () => {
        const center = mapInstanceRef.current.getCenter();
        const zoom = mapInstanceRef.current.getZoom();
        localStorage.setItem('mapState', JSON.stringify({ center, zoom }));
      });
    }
  }, [setMap]);

  useEffect(() => {
    initializeMap();
    initializeTheme(); // Initialize theme from theme-toggle.js
    return () => {
      if (mapInstanceRef.current) {
        const center = mapInstanceRef.current.getCenter();
        const zoom = mapInstanceRef.current.getZoom();
        localStorage.setItem('mapState', JSON.stringify({ center, zoom }));
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        window.currentMap = null; // Clear global reference
      }
    };
  }, [initializeMap]);

  useEffect(() => {
    const handleThemeChange = (event) => {
      const { isLightMode } = event.detail;
      if (mapInstanceRef.current && mapLoaded) {
        mapInstanceRef.current.setStyle(isLightMode ? lightMapStyle : darkMapStyle);
      }
    };

    window.addEventListener('themeChanged', handleThemeChange);
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, [mapLoaded]);

  useEffect(() => {
    let unsubscribe;
    if (mapLoaded && mapInstanceRef.current) {
      trackUserLocation(mapInstanceRef.current, setAddress);
      unsubscribe = setupUserLocationsListener(mapInstanceRef.current, (ids, markers) => {
        setLocalCurrentUserIds(ids);
        setCurrentUserIds(ids);
        markersRef.current = markers;
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [mapLoaded, setAddress, setCurrentUserIds]);

  useEffect(() => {
    if (mapInstanceRef.current && mapLoaded) {
      const handleResize = () => {
        mapInstanceRef.current.resize();
      };

      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [mapLoaded, activeSection, isFullScreen]);

  useEffect(() => {
    if (mapInstanceRef.current && mapLoaded && lockedUser) {
      centerMapOnUser(mapInstanceRef.current, lockedUser);

      Object.keys(markersRef.current).forEach(userId => {
        const marker = markersRef.current[userId];
        const element = marker.getElement();
        const arrow = element.querySelector('.lock-indicator');

        if (userId === lockedUser) {
          if (!arrow) {
            const newArrow = document.createElement('div');
            newArrow.className = 'lock-indicator';
            element.appendChild(newArrow);
          }
        } else if (arrow) {
          element.removeChild(arrow);
        }
      });
    }
  }, [mapLoaded, lockedUser]);

  const handleQuestAccepted = async (quest) => {
    if (mapInstanceRef.current && quest.senderLocation) {
      const { lng, lat } = quest.senderLocation;
      mapInstanceRef.current.flyTo({ center: [lng, lat], zoom: 14 });

      const route = await getRouteToSender(mapInstanceRef.current, quest.senderLocation);
      if (route) {
        const routeLayerId = `route-${quest.id}`;
        if (mapInstanceRef.current.getLayer(routeLayerId)) {
          mapInstanceRef.current.removeLayer(routeLayerId);
          mapInstanceRef.current.removeSource(routeLayerId);
        }

        mapInstanceRef.current.addLayer({
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
      <div ref={mapContainerRef} className={`map-placeholder ${isFullScreen ? 'full-screen' : ''}`} style={{ width: '100%', height: '100%' }}></div>
      {showAddressBar && <div className="address-bar" id="address-bar">{address}</div>}
      {mapInstanceRef.current && <QuestsComponent map={mapInstanceRef.current} currentUserIds={currentUserIds} onQuestAccepted={handleQuestAccepted} />}
    </>
  );
};

export default MapComponent;