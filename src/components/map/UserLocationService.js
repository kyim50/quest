import { collection, onSnapshot, doc, updateDoc, query, where, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import mapboxgl from 'mapbox-gl';

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

export const addMarker = (map, latitude, longitude, userData) => {
  console.log('Adding marker for user:', userData);
  if (!map || typeof map.addLayer !== 'function') {
    console.error('Invalid map object in addMarker');
    return null;
  }

  if (!map.loaded()) {
    console.log('Map not yet loaded, waiting...');
    map.on('load', () => addMarker(map, latitude, longitude, userData));
    return null;
  }

  const el = document.createElement('div');
  el.className = 'marker-container';

  const img = document.createElement('img');
  img.src = userData.profilePhoto || '/default-profile.png';
  img.alt = userData.name || 'User';
  img.className = 'marker-image';

  let errorLogged = false;

  img.onerror = () => {
    if (!errorLogged) {
      console.warn(`Failed to load image for ${userData.name || 'user'}, default profile used.`);
      errorLogged = true;
    }
    img.src = '/default-profile.png';
  };

  el.appendChild(img);

  const dot = document.createElement('div');
  dot.className = 'marker-dot';
  el.appendChild(dot);

  try {
    const marker = new mapboxgl.Marker(el)
      .setLngLat([longitude, latitude])
      .addTo(map);

    console.log('Marker created:', marker);

    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: false,
      closeOnClick: false,
      maxWidth: 'none'
    });

    const popupContent = document.createElement('div');
    popupContent.className = 'custom-popup';
    popupContent.innerHTML = `
      <div class="profile-container">
        <div class="profile-header">
          <div class="profile-photo-container">
            <img src="${userData.profilePhoto || '/default-profile.png'}" alt="${userData.name || 'User'}" class="profile-photo">
          </div>
          <div class="profile-info">
            <h2 class="profile-name">${userData.name || 'Unknown User'}</h2>
            <p class="profile-status"><span class="status-dot"></span> Active</p>
            <p class="profile-bio">${userData.bio || 'No bio available'}</p>
          </div>
        </div>
        <div class="tags-container">
          ${(userData.tags || []).map(tag => `<div class="tag">${tag}</div>`).join('')}
        </div>
        <button class="add-friend-button">Add Friend</button>
      </div>
    `;

    const addFriendButton = popupContent.querySelector('.add-friend-button');
    addFriendButton.addEventListener('click', async () => {
      console.log('Add friend button clicked');
      try {
        const currentUserRef = doc(db, 'users', auth.currentUser.uid);
        const currentUserDoc = await getDoc(currentUserRef);
        const currentUserData = currentUserDoc.data();
        const friends = currentUserData.friends || [];

        if (!friends.includes(userData.id)) {
          await updateDoc(currentUserRef, {
            friends: [...friends, userData.id]
          });
          addFriendButton.textContent = 'Friend Added';
          addFriendButton.disabled = true;
        }
      } catch (error) {
        console.error('Error adding friend:', error);
      }
    });

    popup.setDOMContent(popupContent);

    marker.setPopup(popup);

    marker.getElement().addEventListener('click', (e) => {
      console.log('Marker clicked:', userData);
      e.stopPropagation();
      popup.addTo(map);
    });

    return marker;
  } catch (error) {
    console.error('Error creating marker:', error);
    return null;
  }
};

export const setupUserLocationsListener = (map, setCurrentUserIds) => {
  console.log('Setting up user locations listener');
  if (!map || typeof map.addLayer !== 'function') {
    console.error('Invalid map object in setupUserLocationsListener');
    return () => {};
  }

  if (!map.loaded()) {
    map.on('load', () => setupUserLocationsListener(map, setCurrentUserIds));
    return () => {};
  }

  const usersCollectionRef = collection(db, 'users');
  const activeUsersQuery = query(usersCollectionRef, where("isActive", "==", true));

  return onSnapshot(activeUsersQuery, async (snapshot) => {
    console.log('User locations snapshot received');
    const activeUserIds = new Set();
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.warn('No authenticated user found');
      return;
    }

    const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const currentUserData = currentUserDoc.data();
    const currentUserFriends = currentUserData?.friends || [];
    const isCurrentUserPrivate = currentUserData?.isPrivate || false;

    snapshot.forEach(async (doc) => {
      const userId = doc.id;
      const userData = doc.data();
      console.log('Processing user:', userId, userData);

      const isVisible = !userData.isPrivate || 
                        userId === currentUser.uid || 
                        (isCurrentUserPrivate && currentUserFriends.includes(userId)) ||
                        (!isCurrentUserPrivate && currentUserFriends.includes(userId));

      if (userData.isActive && userData.location && isVisible) {
        activeUserIds.add(userId);

        const lastActivityTimestamp = new Date(userData.location.timestamp).getTime();
        const currentTimestamp = new Date().getTime();
        const inactiveTime = currentTimestamp - lastActivityTimestamp;

        if (inactiveTime > 300000) {
          console.log('Removing inactive user:', userId);
          if (markers[userId]) {
            markers[userId].remove();
            delete markers[userId];
          }
        } else {
          if (markers[userId]) {
            console.log('Updating marker for user:', userId);
            markers[userId].setLngLat([userData.location.longitude, userData.location.latitude]);
          } else {
            console.log('Adding new marker for user:', userId);
            const marker = addMarker(
              map,
              userData.location.latitude,
              userData.location.longitude,
              {
                id: userId,
                name: userData.name,
                profilePhoto: userData.profilePhoto,
                bio: userData.bio,
                tags: userData.tags
              }
            );
            if (marker) markers[userId] = marker;
          }
        }
      } else {
        console.log('Removing marker for non-visible user:', userId);
        if (markers[userId]) {
          markers[userId].remove();
          delete markers[userId];
        }
      }
    });

    Object.keys(markers).forEach(markerId => {
      if (!activeUserIds.has(markerId)) {
        console.log('Removing marker for user no longer in snapshot:', markerId);
        markers[markerId].remove();
        delete markers[markerId];
      }
    });

    if (typeof setCurrentUserIds === 'function') {
      setCurrentUserIds([...activeUserIds]);
    } else {
      console.warn('setCurrentUserIds is not a function');
    }
  });
};

export const trackUserLocation = (map, setAddress) => {
  console.log('Setting up user location tracking');
  if (!map || typeof map.addLayer !== 'function') {
    console.error('Invalid map object in trackUserLocation');
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
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 27000
      }
    );

    return watchId;
  } else {
    console.error('Geolocation is not supported by this browser.');
  }
};

export const displayRoute = async (map, senderLocation, receiverLocation) => {
  if (!map || !map.loaded()) {
    console.error('Map is not fully loaded');
    return;
  }

  const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${senderLocation.longitude},${senderLocation.latitude};${receiverLocation.longitude},${receiverLocation.latitude}?geometries=geojson&access_token=${mapboxgl.accessToken}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      console.error('No route found in the response');
      return;
    }

    const route = data.routes[0].geometry;

    removeRoute(map);

    map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: route
      }
    });

    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#00FFFF',
        'line-width': 5,
        'line-opacity': 0.75
      }
    });

    addMarker(map, 'sender', senderLocation, '#3887be');
    addMarker(map, 'receiver', receiverLocation, '#f30');

    const coordinates = route.coordinates;
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord);
    }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

    map.fitBounds(bounds, {
      padding: 50,
      maxZoom: 15,
      duration: 1000
    });

  } catch (error) {
    console.error('Error fetching or displaying route:', error);
  }
};

export const removeRoute = (map) => {
  if (!map || !map.loaded()) {
    console.error('Map is not fully loaded');
    return;
  }

  if (map.getLayer('route')) {
    map.removeLayer('route');
  }
  if (map.getSource('route')) {
    map.removeSource('route');
  }

  // Remove route markers
  ['sender', 'receiver'].forEach(id => {
    if (markers[id]) {
      markers[id].remove();
      delete markers[id];
    }
  });
};

export const centerMapOnUser = async (map, userId) => {
  if (!map) {
    console.error('Map object is not available');
    return;
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();

    if (userData && userData.location) {
      map.flyTo({
        center: [userData.location.longitude, userData.location.latitude],
        zoom: 15,
        duration: 1000
      });
    } else {
      console.warn(`No location data found for user ${userId}`);
    }
  } catch (error) {
    console.error('Error centering map on user:', error);
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