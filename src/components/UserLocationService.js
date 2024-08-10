import { collection, onSnapshot, doc, updateDoc, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import mapboxgl from 'mapbox-gl';
import './MapComponent';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoia3lpbTUwIiwiYSI6ImNsempkdjZibDAzM2MybXE4bDJmcnZ6ZGsifQ.-ie6lQO1TWYrL8c6h2W41g';
mapboxgl.accessToken = MAPBOX_TOKEN;

let lastUserLocation = null;
let hasInitializedFlyTo = false;
const markers = {}; // Global object to manage all markers

export const updateUserLocation = async (latitude, longitude) => {
  if (auth.currentUser) {
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    try {
      await updateDoc(userDocRef, {
        location: {
          latitude,
          longitude,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }
};

export const addMarker = (map, latitude, longitude, profilePhotoUrl, name, bio) => {
  if (!map || typeof map.getCanvasContainer !== 'function') {
    console.error('Invalid map object');
    return null;
  }

  const el = document.createElement('div');
  el.className = 'marker-container';

  const img = document.createElement('img');
  img.src = profilePhotoUrl || '/default-profile.png';
  img.alt = name;

  let errorLogged = false;

  img.onerror = () => {
    if (!errorLogged) {
      console.warn(`Failed to load image for ${name}, default profile used.`);
      errorLogged = true; // Log the error only once
    }
    img.src = '/default-profile.png'; // Fallback to default image
  };

  el.appendChild(img);

  const dot = document.createElement('div');
  dot.className = 'marker-dot';
  el.appendChild(dot);

  const marker = new mapboxgl.Marker(el)
    .setLngLat([longitude, latitude])
    .addTo(map);

  const popup = new mapboxgl.Popup({ offset: 25 })
    .setHTML(`<h3>${name}</h3><p>${bio}</p>`);

  marker.setPopup(popup);

  return marker;
};

export const setupUserLocationsListener = (map, setCurrentUserIds) => {
  if (!map || typeof map.getCanvasContainer !== 'function') {
    console.error('Invalid map object');
    return () => {};
  }

  const usersCollectionRef = collection(db, 'users');
  const activeUsersQuery = query(usersCollectionRef, where("isActive", "==", true));

  return onSnapshot(activeUsersQuery, snapshot => {
    const activeUserIds = new Set();

    snapshot.forEach(doc => {
      const userId = doc.id;
      const userData = doc.data();

      // Filter for active users only
      if (userData.isActive && userData.location) {
        activeUserIds.add(userId);

        // Check if the user has been inactive for more than 5 minutes (300000 milliseconds)
        const lastActivityTimestamp = new Date(userData.location.timestamp).getTime();
        const currentTimestamp = new Date().getTime();
        const inactiveTime = currentTimestamp - lastActivityTimestamp;

        if (inactiveTime > 300000) {
          // Remove the marker for inactive users
          if (markers[userId]) {
            markers[userId].remove();
            delete markers[userId];
          }
        } else {
          // Update or add marker for active users
          if (markers[userId]) {
            // Update existing marker position
            markers[userId].setLngLat([userData.location.longitude, userData.location.latitude]);
          } else {
            // Add new marker for active user
            const marker = addMarker(
              map,
              userData.location.latitude,
              userData.location.longitude,
              userData.profilePhotoUrl,
              userData.name,
              userData.bio
            );
            if (marker) markers[userId] = marker;
          }
        }
      }
    });

    // Remove markers for users no longer in the active snapshot
    Object.keys(markers).forEach(markerId => {
      if (!activeUserIds.has(markerId)) {
        markers[markerId].remove();
        delete markers[markerId];
      }
    });

    setCurrentUserIds([...activeUserIds]);
  });
};

export const trackUserLocation = (map, setAddress) => {
  if (!map || typeof map.getCanvasContainer !== 'function') {
    console.error('Invalid map object');
    return;
  }

  if ('geolocation' in navigator) {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateUserLocation(latitude, longitude);

        const shouldFlyTo = !lastUserLocation || 
                            !hasInitializedFlyTo || 
                            (Math.abs(latitude - lastUserLocation.latitude) > 0.001 || 
                             Math.abs(longitude - lastUserLocation.longitude) > 0.001);

        if (shouldFlyTo) {
          map.flyTo({
            center: [longitude, latitude],
            zoom: 15
          });
          lastUserLocation = { latitude, longitude };
          hasInitializedFlyTo = true;
        }
        // Fetch the address using Mapbox Geocoding API
        fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_TOKEN}`)
          .then(response => response.json())
          .then(data => {
            if (data.features && data.features.length > 0) {
              setAddress(data.features[0].place_name);
            }
          })
          .catch(error => {
            console.error('Error fetching address:', error);
          });
      },
      (error) => {
        console.error('Error getting location:', error);
      },
      {
        enableHighAccuracy: true, // Request the most accurate position data
        maximumAge: 0, // Set maximumAge to 0 for continuous updates
        timeout: 27000
      }
    );

    // Return the watchId so it can be cleared when needed
    return watchId;
  } else {
    console.error('Geolocation is not supported by this browser.');
  }
};



export const setUserIsActive = async (isActive) => {
  if (auth.currentUser) {
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    try {
      await updateDoc(userDocRef, { isActive });
    } catch (error) {
      console.error('Error updating active status:', error);
    }
  }
};
