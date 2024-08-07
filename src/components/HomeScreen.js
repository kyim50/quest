import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, uploadImage, updateUserProfile, fetchAllUserLocations, fetchUserLocations, fetchUserData, updateLastActive, setUserIsActive } from '../firebase';
import { doc, updateDoc, collection, getDocs, onSnapshot, getDoc } from 'firebase/firestore';
import mapboxgl from 'mapbox-gl';
import '../styles/mapstyles.css';
import Quests from './Quests.js';
import Connections from './Connections.js';
import NotificationDisplay from '../NotificationDisplay.js';
import { useNotification } from '../NotificationContext';
import { Privacy } from './Privacy.js';
import { debounce } from 'lodash';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoia3lpbTUwIiwiYSI6ImNsempkdjZibDAzM2MybXE4bDJmcnZ6ZGsifQ.-ie6lQO1TWYrL8c6h2W41g';
mapboxgl.accessToken = MAPBOX_TOKEN;

const HomeScreen = () => {
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const [address, setAddress] = useState('Loading address...');
  const [activeSection, setActiveSection] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('placeholder.jpg');
  const [name, setName] = useState('Default Name');
  const [bio, setBio] = useState('Default Bio');
  const [status, setStatus] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isQuestWindowOpen, setIsQuestWindowOpen] = useState(false);
  const [currentUserIds, setCurrentUserIds] = useState([]);
  const [quests, setQuests] = useState([]);
  const [currentQuest, setCurrentQuest] = useState(null);
  const fileInputRef = useRef(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isPrivate, setIsPrivate] = useState(false);

  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const getReceiverId = () => {
    const user = auth.currentUser;
    if (!user || !user.uid) {
      console.error('Current user or receiverId is not defined');
      return null;
    }
    return user.uid;
  };

  const handlePrivacyModeChange = async (newPrivacyMode) => {
    setIsPrivate(newPrivacyMode);

    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      try {
        await updateDoc(userDocRef, { isPrivate: newPrivacyMode });
      } catch (error) {
        console.error('Error updating privacy mode:', error);
      }
    }

    displayAllUserMarkers();
  };

  const heartbeatInterval = 30000;

  const sendHeartbeat = async () => {
    if (auth.currentUser) {
      await updateLastActive(auth.currentUser.uid);
    }
  };

  useEffect(() => {
    const heartbeatTimer = setInterval(() => {
      sendHeartbeat();
    }, heartbeatInterval);

    return () => clearInterval(heartbeatTimer);
  }, []);

  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      marker.remove();
    });
    markersRef.current = [];
  };

  const viewUserProfile = async (receiverId) => {
    try {
      const userData = await fetchUserData(receiverId);
      if (userData) {
        console.log('User data:', userData);
        // Add code here to display the user profile details in a larger container
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  window.viewUserProfile = viewUserProfile;

  const addMarker = (latitude, longitude, profilePhotoUrl, name, bio, isFriend, receiverId) => {
    const currentUserId = getReceiverId();
    const isCurrentUser = currentUserId === receiverId;

    const userIcon = document.createElement('div');
    userIcon.className = 'user-icon';
    userIcon.innerHTML = `<div class="marker-container"><img src="${profilePhotoUrl}" alt="Profile Photo" /></div>`;

    let viewButton = '';
    if (receiverId !== getReceiverId()) {
      viewButton = `<button onclick="viewUserProfile('${receiverId}')">View</button>`;
    }

    const popupContent = `
      <div class="popup-content">
        <img src="${profilePhotoUrl}" alt="Profile Photo" />
        <div>
          <h3>${name}</h3>
          <p>${bio}</p>
          ${viewButton}
        </div>
      </div>
    `;

    const marker = new mapboxgl.Marker(userIcon)
      .setLngLat([longitude, latitude])
      .setPopup(new mapboxgl.Popup().setHTML(popupContent))
      .addTo(mapRef.current);

    markersRef.current.push(marker);
    console.log('Marker added:', marker);
  };

  const debouncedUpdateMarker = useCallback(debounce((profilePhotoUrl, latitude, longitude) => {
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [longitude, latitude], zoom: 13 });

      clearMarkers();
      addMarker(latitude, longitude, profilePhotoUrl, 'Your current location');

      updateUserLocation(latitude, longitude);

      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          const userAddress = data.display_name || 'Address not found';
          setAddress(userAddress);
        })
        .catch(error => {
          console.error('Error fetching address:', error);
          setAddress('Error fetching address');
        });
    }
  }, 500), []);

  useEffect(() => {
    const checkAuthStatus = () => {
      const unsubscribeAuth = auth.onAuthStateChanged(user => {
        if (user) {
          setUserIsActive(true);
          fetchUserDataAndUpdate();
          setupUserLocationsListener();
        } else {
          setUserIsActive(false);
          navigate('/login');
        }
      });

      return () => unsubscribeAuth();
    };

    const fetchUserDataAndUpdate = async () => {
      try {
        const userData = await fetchUserData(auth.currentUser.uid);
        if (userData) {
          setName(userData.name || 'Default Name');
          setProfilePhoto(userData.profilePhoto || 'placeholder.jpg');
          setBio(userData.bio || 'Default Bio');
          setStatus(userData.status || '');
          setIsPrivate(userData.isPrivate || false);

          if (userData.currentQuest) {
            const senderData = await fetchUserData(userData.currentQuest.senderId);
            const receiverData = await fetchUserData(userData.currentQuest.receiverId);
            setCurrentQuest({
              ...userData.currentQuest,
              senderName: senderData.name || 'Unknown Sender',
              receiverName: receiverData.name || 'Unknown Receiver',
              state: userData.currentQuest.isAccepted ? 'Pending' : 'In Progress',
            });
          } else {
            setCurrentQuest(null);
          }

          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const latitude = position.coords.latitude;
              const longitude = position.coords.longitude;
              debouncedUpdateMarker(userData.profilePhoto || 'placeholder.jpg', latitude, longitude);
            },
            (error) => {
              console.error('Error getting user location:', error);
              setAddress('Unable to retrieve location');
            }
          );
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    const fetchQuests = () => {
      const questsCollection = collection(db, 'quests');
      const unsubscribe = onSnapshot(questsCollection, (snapshot) => {
        const questsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setQuests(questsData);
      }, (error) => {
        console.error('Error fetching quests:', error);
      });

      return unsubscribe;
    };

    if (!mapRef.current) {
      const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/dark-v10',
        center: [0, 0],
        zoom: 2
      });
      mapRef.current = map;

      map.on('load', () => {
        checkAuthStatus();
        const unsubscribeQuests = fetchQuests();

        return () => {
          unsubscribeQuests();
        };
      });
    } else {
      checkAuthStatus();
    }
  }, [navigate, debouncedUpdateMarker]);

  const updateUserLocation = async (latitude, longitude) => {
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

  const isUserActive = (lastActive) => {
    const now = new Date();
    let lastActiveDate;

    if (typeof lastActive === 'string') {
      lastActiveDate = new Date(lastActive);
    } else if (typeof lastActive === 'number') {
      lastActiveDate = new Date(lastActive);
    } else {
      return false;
    }

    return now - lastActiveDate < heartbeatInterval;
  };

  const displayAllUserMarkers = async () => {
    try {
      const users = await fetchAllUserLocations();
      const receiverId = getReceiverId();
      if (!receiverId) return;

      const currentUserDocRef = doc(db, 'users', receiverId);
      const currentUserDoc = await getDoc(currentUserDocRef);
      const currentUserFriends = currentUserDoc.data().friends || [];

      clearMarkers();

      const userIds = users.map(user => {
        const { location, profilePhoto, name, bio, receiverId } = user;
        if (isUserActive(user.lastActive) && location && typeof location.latitude === 'number' && typeof location.longitude === 'number') {
          const isFriend = currentUserFriends.includes(receiverId);
          addMarker(location.latitude, location.longitude, profilePhoto || 'placeholder.jpg', name, bio, isFriend, receiverId);
          return receiverId;
        }
        return null;
      }).filter(id => id !== null);

      setCurrentUserIds(userIds);
    } catch (error) {
      console.error('Error displaying user markers:', error);
    }
  };

  const setUserIsActive = async (isActive) => {
    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      try {
        await updateDoc(userDocRef, { isActive });
      } catch (error) {
        console.error('Error updating active status:', error);
      }
    }
  };

  const setupUserLocationsListener = () => {
    const usersCollectionRef = collection(db, 'users');

    const unsubscribe = onSnapshot(usersCollectionRef, async snapshot => {
      const users = snapshot.docs.map(doc => doc.data());
      clearMarkers();

      const receiverId = getReceiverId();
      if (!receiverId) return;

      const currentUserDocRef = doc(db, 'users', receiverId);
      const currentUserDoc = await getDoc(currentUserDocRef);
      const currentUserFriends = currentUserDoc.data().friends || [];

      const userIds = users.map(user => {
        const { location, profilePhoto, name, bio, receiverId } = user;
        if (isUserActive(user.lastActive) && location && typeof location.latitude === 'number' && typeof location.longitude === 'number') {
          const isFriend = currentUserFriends.includes(receiverId);
          addMarker(location.latitude, location.longitude, profilePhoto || 'placeholder.jpg', name, bio, isFriend, receiverId);
          return receiverId;
        }
        return null;
      }).filter(id => id !== null);

      setCurrentUserIds(userIds);
    });

    return () => unsubscribe();
  };

  const editProfile = () => {
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setSelectedPhoto(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    let newProfilePhotoURL = profilePhoto;

    if (selectedPhoto) {
      try {
        newProfilePhotoURL = await uploadImage(selectedPhoto);
        setProfilePhoto(newProfilePhotoURL);
      } catch (error) {
        console.error('Error uploading photo:', error);
        showNotification('Error uploading photo', 'error');
        return;
      }
    }

    const newName = document.getElementById('edit-name').value;
    const newBio = document.getElementById('edit-bio').value;
    const newStatus = document.getElementById('edit-status').value;

    try {
      await updateUserProfile(auth.currentUser.uid, {
        profilePhoto: newProfilePhotoURL,
        name: newName || name,
        bio: newBio || bio,
        status: newStatus || status,
      });

      setName(newName || name);
      setBio(newBio || bio);
      setStatus(newStatus || status);
      setProfilePhoto(newProfilePhotoURL);
      debouncedUpdateMarker(newProfilePhotoURL);

      showNotification('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating user profile:', error);
      showNotification('Error updating profile', 'error');
    }

    setIsEditing(false);
    setSelectedPhoto(null);
  };

  const showSection = (sectionId) => {
    if (activeSection === sectionId) {
      setActiveSection('');
      setIsQuestWindowOpen(false);
    } else {
      setActiveSection(sectionId);
      if (sectionId === 'quests-section') {
        setIsQuestWindowOpen(true);
      } else {
        setIsQuestWindowOpen(false);
      }
    }
  };

  const handleLogout = () => {
    if (auth.currentUser) {
      setUserIsActive(false)
        .then(() => {
          localStorage.clear();
          auth.signOut().then(() => {
            navigate('/login');
          }).catch((error) => {
            console.error('Error signing out:', error);
            showNotification('Error signing out', 'error');
          });
        });
    } else {
      localStorage.clear();
      auth.signOut().then(() => {
        navigate('/login');
      }).catch((error) => {
        console.error('Error signing out:', error);
        showNotification('Error signing out', 'error');
      });
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const closeQuestWindow = () => {
    setIsQuestWindowOpen(false);
    setActiveSection('profile-section');
  };

  const handleStatusSubmit = async () => {
    try {
      await updateUserProfile(auth.currentUser.uid, {
        status: status,
      });

      setStatus(status);
      showNotification('Status updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating user status:', error);
      showNotification('Error updating status', 'error');
    }
  };

  useEffect(() => {
    const statusTimeout = setTimeout(() => {
      setStatus('');
      updateUserProfile(auth.currentUser.uid, {
        status: '',
      });
    }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds

    return () => clearTimeout(statusTimeout);
  }, [status]);

  return (
    <div className="map-container">
      <div className="logout-container">
        <button className="logout-btn" onClick={handleLogout}>
          <img src="/logout.png" alt="Log Out" />
        </button>
      </div>
      <div id="map" className="map-placeholder"></div>
      <div className="address-bar" id="address-bar">{address}</div>

      {/* Render Notification Display */}
      <NotificationDisplay />

      <div className={`rectangular-container ${activeSection ? '' : 'hidden'}`} id="content-container">
        {activeSection === 'profile-section' && (
          <section id="profile-section" className={`content-section ${activeSection === 'profile-section' ? 'show-section' : 'hide-section'}`}>
            <div className="profile-container">
              <button className="edit-profile-btn" onClick={editProfile}>
                <img src="/edit.png" alt="Edit Profile" />
              </button>
              <div className="profile-photo" onClick={isEditing ? handlePhotoClick : undefined}>
                <img id="profile-photo" src={profilePhoto} alt="Profile" />
              </div>
              <div className="profile-info">
                <div className="profile-name" id="profile-name">{name}</div>
                <div className="profile-bio" id="profile-bio">{bio}</div>
                <div className="profile-status" id="profile-status">{status}</div>
              </div>
              {isEditing && (
                <form id="profile-form" onSubmit={handleSubmit}>
                  <input type="text" id="edit-name" placeholder="Enter new name" defaultValue={name} />
                  <input type="text" id="edit-bio" placeholder="Enter new bio" defaultValue={bio} />
                  <input
                    type="text"
                    id="edit-status"
                    placeholder="Enter your status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleStatusSubmit();
                      }
                    }}
                  />
                  <button type="button" className="uploadpfp" onClick={handlePhotoClick}>Upload Profile Photo</button>
                  <input
                    type="file"
                    id="edit-photo"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                  <button type="submit" className="save">Save Changes</button>
                  <button type="button" className="cancel" onClick={cancelEdit}>Cancel</button>
                </form>
              )}

              {!isEditing && currentQuest && (
                <div className="current-quest-info">
                  <h3>Current Quest</h3>
                  <p>Title: {currentQuest.name}</p>
                  <p>State: {currentQuest.state}</p>
                </div>
              )}

              <Privacy isPrivate={isPrivate} onPrivacyModeChange={handlePrivacyModeChange} />
            </div>
          </section>
        )}

        {activeSection === 'quests-section' && (
          <div className={`quests-window ${isQuestWindowOpen ? 'show-section' : 'hide-section'}`}>
            <Quests quests={quests} currentUserIds={currentUserIds} />
          </div>
        )}

        {activeSection === 'connections-section' && (
          <section id="connections-section" className={`content-section ${activeSection === 'connections-section' ? 'show-section' : 'hide-section'}`}>
            <Connections currentUserIds={currentUserIds} />
          </section>
        )}

        {/* Other sections (e.g., history) */}
      </div>

      <div className={`nav-bar ${activeSection ? 'hide-nav-bar' : ''}`}>
        <nav>
          <button onClick={() => showSection('profile-section')} className="nav-button">
            <img src="profile.png" alt="Profile Icon" />
          </button>
          <button onClick={() => showSection('connections-section')} className="nav-button">
            <img src="connections.png" alt="Connections Icon" />
          </button>
          <button onClick={() => showSection('quests-section')} className="nav-button">
            <img src="quest.png" alt="Quests Icon" />
          </button>
          <button onClick={() => showSection('history-section')} className="nav-button">
            <img src="history.png" alt="History Icon" />
          </button>
        </nav>
      </div>
    </div>
  );
};

export default HomeScreen;
