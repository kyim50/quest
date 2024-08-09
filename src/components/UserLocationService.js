import { collection, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import mapboxgl from 'mapbox-gl';

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

export const addMarker = (map, latitude, longitude, profilePhotoUrl, name, bio, isFriend, receiverId) => {
  // ... (implementation of addMarker function)
};

export const clearMarkers = (markers) => {
  markers.forEach(marker => marker.remove());
  return [];
};

export const setupUserLocationsListener = (setCurrentUserIds) => {
  const usersCollectionRef = collection(db, 'users');

  return onSnapshot(usersCollectionRef, async snapshot => {
    // ... (implementation of user locations listener)
  });
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

// ... (other location-related functions)