import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import '../styles/mapstyles.css';
import '../styles/HomeScreen.css';
import MapComponent from './MapComponent';
import UserProfile from './UserProfile';
import QuestsComponent from './QuestsComponent';
import Connections from './Connections';
import HistorySection from './HistorySection';
import PrivacySection from './PrivacySection';
import NavigationBar from './NavigationBar';
import { useNotification } from '../NotificationContext';
import { checkAuthStatus, handleLogout } from './UserAuthService';
import { doc, getDoc } from 'firebase/firestore';
import { Camera } from 'react-camera-pro';
import { IconButton } from '@mui/material';
import { ArrowBack, CameraAlt, Refresh, Person, ChatBubbleOutline } from '@mui/icons-material';

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
  const cameraRef = useRef(null);

  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    const unsubscribeAuth = checkAuthStatus(navigate);
    return () => unsubscribeAuth();
  }, [navigate]);

  const showSection = (sectionId) => {
    setActiveSection(sectionId === activeSection ? '' : sectionId);
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
    setCapturedImage(imageSrc);
    setShowCamera(false);
  };

  const handleFlipCamera = () => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  };

  const toggleCamera = () => {
    setShowCamera(!showCamera);
  };

  const PinterestLayout = () => {
    const dummyData = [
      { size: 'small', user: 'User1' },
      { size: 'medium', user: 'User2' },
      { size: 'large', user: 'User3' },
      { size: 'small', user: 'User4' },
      { size: 'medium', user: 'User5' },
      { size: 'large', user: 'User6' },
      { size: 'medium', user: 'User7' },
      { size: 'large', user: 'User8' },
      { size: 'small', user: 'User9' },
    ];

    return (
      <div className="pin-container">
        {dummyData.map((item, index) => (
          <Card key={index} size={item.size} user={item.user} />
        ))}
      </div>
    );
  };

  const Card = ({ size, user }) => {
    return (
      <div className={`card ${size}`}>
        <div className="user-info">
          <div className="avatar"></div>
          <span className="username">@{user}</span>
        </div>
      </div>
    );
  };

  const renderHomeContent = () => (
    <div className="home-content">
      <div className="top-bar">
        <IconButton className="profile-button">
          <Person />
        </IconButton>
        <IconButton className="chat-button">
          <ChatBubbleOutline />
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
          <div className="mini-map">
            <MapComponent 
              address={address} 
              setAddress={setAddress} 
              setCurrentUserIds={setCurrentUserIds}
              setMap={setMap}
              activeSection={activeSection}
              lockedUser={lockedUser}
              showAddressBar={false}
            />
          </div>
        </div>
      </div>
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
        {renderSection()}
      </div>
    </div>
  );
};

export default HomeScreen;