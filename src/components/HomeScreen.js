import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import '../styles/mapstyles.css';
import '../styles/HomeScreen.css';
import '../styles/profile.css';
import MapComponent from './MapComponent';
import UserProfile from './UserProfile';
import QuestsComponent from './QuestsComponent';
import Connections from './Connections';
import HistorySection from './HistorySection';
import PrivacySection from './PrivacySection';
import NavigationBar from './NavigationBar';
import { useNotification } from '../NotificationContext';
import { checkAuthStatus, handleLogout } from './UserAuthService';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Camera } from 'react-camera-pro';
import { IconButton } from '@mui/material';
import { ArrowBack, CameraAlt, Refresh, Person, LocationOn, Close } from '@mui/icons-material';

const HomeScreen = () => {
  const [activeSection, setActiveSection] = useState('');
  const [currentUserIds, setCurrentUserIds] = useState([]);
  const [address, setAddress] = useState('Loading address...');
  const [map, setMap] = useState(null);
  const [lockedUser, setLockedUser] = useState(null);
  const [lockedUserData, setLockedUserData] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [flash, setFlash] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [userProfileData, setUserProfileData] = useState(null);
  const [showFullMap, setShowFullMap] = useState(false);
  const [isLocationLocked, setIsLocationLocked] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoSize, setPhotoSize] = useState('medium');
  const [friendsList, setFriendsList] = useState([]);
  const cameraRef = useRef(null);

  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    const unsubscribeAuth = checkAuthStatus(navigate);
    return () => unsubscribeAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserProfileData(userDoc.data());
        }
      }
    };
    fetchUserProfile();
  }, []);

  useEffect(() => {
    const fetchFriends = async () => {
      if (auth.currentUser) {
        const friendsRef = collection(db, 'users', auth.currentUser.uid, 'friends');
        const friendsSnapshot = await getDocs(friendsRef);
        const friendIds = friendsSnapshot.docs.map(doc => doc.id);
        setFriendsList(friendIds);
      }
    };
    fetchFriends();
  }, []);

  const showSection = (sectionId) => {
    setActiveSection(sectionId === activeSection ? '' : sectionId);
    setShowFullMap(false);
  };

  const handleSetLockedUser = useCallback(async (userId) => {
    console.log("Setting locked user:", userId);
    if (userId) {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setLockedUser(userId);
          setLockedUserData({ id: userId, ...userData });
          setActiveSection('connections');
          if (map) {
            map.flyTo({
              center: [userData.location.longitude, userData.location.latitude],
              zoom: 15
            });
          }
        } else {
          console.error("No user found with ID:", userId);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    } else {
      setLockedUser(null);
      setLockedUserData(null);
      if (map && auth.currentUser) {
        const currentUserDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const currentUserData = currentUserDoc.data();
        map.flyTo({
          center: [currentUserData.location.longitude, currentUserData.location.latitude],
          zoom: 15
        });
      }
    }
  }, [map]);

  const handleCapture = () => {
    const imageSrc = cameraRef.current.takePhoto();
    setPhotoPreview(imageSrc);
    setShowCamera(false);
  };

  const handleFlipCamera = () => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  };

  const toggleCamera = () => {
    setShowCamera(!showCamera);
  };

  const toggleProfilePopup = () => {
    setShowProfilePopup(!showProfilePopup);
  };

  const toggleFullMap = () => {
    setShowFullMap(!showFullMap);
    if (!showFullMap && map && userProfileData?.location) {
      map.flyTo({
        center: [userProfileData.location.longitude, userProfileData.location.latitude],
        zoom: 15,
        duration: 2000
      });
    }
  };

  const toggleLocationLock = () => {
    setIsLocationLocked(!isLocationLocked);
    // Implement the location locking logic here
  };

  const handleUploadPhoto = async () => {
    if (auth.currentUser && photoPreview) {
      try {
        const photoRef = doc(collection(db, 'photos'));
        await setDoc(photoRef, {
          userId: auth.currentUser.uid,
          username: auth.currentUser.displayName,
          image: photoPreview,
          size: photoSize,
          timestamp: new Date(),
        });
        showNotification('Photo uploaded successfully');
        setPhotoPreview(null);
      } catch (error) {
        console.error('Error uploading photo:', error);
        showNotification('Failed to upload photo. Please try again.');
      }
    }
  };

  const PinterestLayout = () => {
    const [gridData, setGridData] = useState([]);

    useEffect(() => {
      const fetchGridData = async () => {
        const photosRef = collection(db, 'photos');
        const q = query(photosRef, where('userId', 'in', [auth.currentUser.uid, ...friendsList]));
        const photosSnapshot = await getDocs(q);
        const photos = photosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGridData(photos);
      };
      fetchGridData();
    }, [friendsList]);

    return (
      <div className="pin-container">
        {gridData.map((item, index) => (
          <Card key={index} size={item.size} user={item.username} image={item.image} />
        ))}
      </div>
    );
  };

  const Card = ({ size, user, image }) => {
    return (
      <div className={`card ${size}`}>
        <img src={image} alt={`Photo by ${user}`} className="card-image" />
        <div className="user-info">
          <div className="avatar"></div>
          <span className="username">@{user}</span>
        </div>
      </div>
    );
  };

  const ProfilePopup = () => (
    <div className="profile-popup">
      <div className="profile-popup-content">
        <IconButton onClick={toggleProfilePopup} className="close-button">
          <Close />
        </IconButton>
        <div className="profile-header">
          <div className="profile-photo-container">
            <img src={userProfileData?.profileImage || 'default-profile-image.jpg'} alt="Profile" className="profile-photo" />
          </div>
          <div className="profile-name-status">
            <h2 className="profile-name">{userProfileData?.name || 'User Name'}</h2>
            <p className="profile-status">
              <span className="status-dot"></span>
              Active now
            </p>
          </div>
        </div>
        <div className="profile-section">
          <p className="profile-bio">{userProfileData?.bio || 'No bio available'}</p>
        </div>
      </div>
    </div>
  );

  const renderHomeContent = () => (
    <div className="home-content">
      <div className="top-bar">
        <IconButton className="profile-button" onClick={toggleProfilePopup}>
          <Person />
        </IconButton>
        <IconButton className="location-lock-button" onClick={toggleLocationLock}>
          <LocationOn color={isLocationLocked ? "primary" : "inherit"} />
        </IconButton>
      </div>

      <div className="main-area">
        <div className="grid-area">
          <PinterestLayout />
        </div>
        <div className="camera-map-area">
          {showCamera ? (
            <div className="camera-container">
              <Camera
                ref={cameraRef}
                facingMode={facingMode}
                aspectRatio="cover"
                errorMessages={{}}
              />
              <div className="camera-controls">
                <IconButton onClick={toggleCamera} className="back-button">
                  <ArrowBack />
                </IconButton>
                <IconButton onClick={handleCapture} className="capture-button">
                  <div className="capture-button-inner" />
                </IconButton>
                <IconButton onClick={handleFlipCamera} className="flip-button">
                  <Refresh />
                </IconButton>
              </div>
            </div>
          ) : (
            <div className="camera-placeholder" onClick={toggleCamera}>
              <CameraAlt />
              <span>Open Camera</span>
            </div>
          )}
          <div className="mini-map" onClick={toggleFullMap}>
            <MapComponent 
              address={address} 
              setAddress={setAddress} 
              setCurrentUserIds={setCurrentUserIds}
              setMap={setMap}
              activeSection={activeSection}
              lockedUser={lockedUser}
              showAddressBar={false}
              isFullScreen={false}
              isLocationLocked={isLocationLocked}
            />
          </div>
        </div>
      </div>

      {showProfilePopup && <ProfilePopup />}
      {photoPreview && (
        <div className="photo-preview-overlay">
          <div className="photo-preview-container">
            <img src={photoPreview} alt="Captured" className="photo-preview" />
            <div className="photo-preview-controls">
              <select value={photoSize} onChange={(e) => setPhotoSize(e.target.value)}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
              <button onClick={handleUploadPhoto}>Upload</button>
              <button onClick={() => setPhotoPreview(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFullMap = () => (
    <div className="full-map-container">
      <IconButton onClick={toggleFullMap} className="back-button">
        <ArrowBack />
      </IconButton>
      <MapComponent 
        address={address} 
        setAddress={setAddress} 
        setCurrentUserIds={setCurrentUserIds}
        setMap={setMap}
        activeSection={activeSection}
        lockedUser={lockedUser}
        showAddressBar={true}
        isFullScreen={true}
        isLocationLocked={isLocationLocked}
      />
    </div>
  );

  const renderSection = () => {
    switch(activeSection) {
      case 'profile':
        return <UserProfile handleLogout={handleLogoutClick} />;
      case 'quests':
        return <QuestsComponent currentUserIds={currentUserIds} map={map} />;
      case 'connections':
        return <Connections 
          currentUserIds={currentUserIds}
          map={map}
          setLockedUser={setLockedUser}
          lockedUser={lockedUser}
          lockedUserData={lockedUserData}
        />;
      case 'history':
        return <HistorySection currentUser={auth.currentUser} />;
      case 'privacy':
        return <PrivacySection />;
      default:
        return renderHomeContent();
    }
  };

  const handleLogoutClick = async () => {
    try {
      await handleLogout();
      showNotification('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      showNotification('Logout failed. Please try again.');
    }
  };

  const getActiveClass = () => {
    if (activeSection === '') {
      return 'home-active';
    }
    if (activeSection === 'profile' || activeSection === 'privacy') {
      return `${activeSection}-active`;
    }
    if (activeSection === 'connections') {
      return lockedUser ? 'connections-locked-active' : 'connections-active';
    }
    return activeSection ? `${activeSection}-active` : '';
  };

  return (
    <div className="home-screen-container">
      <NavigationBar 
        activeSection={activeSection} 
        showSection={showSection} 
      />
      <div className={`main-content ${getActiveClass()}`}>
        {showFullMap ? renderFullMap() : renderSection()}
        {activeSection !== '' && !showFullMap && (
          <div className="map-container">
            <MapComponent 
              address={address} 
              setAddress={setAddress} 
              setCurrentUserIds={setCurrentUserIds}
              setMap={setMap}
              activeSection={activeSection}
              lockedUser={lockedUser}
              showAddressBar={true}
              isFullScreen={false}
              isLocationLocked={isLocationLocked}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;