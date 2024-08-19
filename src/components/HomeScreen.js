import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import '../styles/mapstyles.css';
import MapComponent from './MapComponent';
import UserProfile from './UserProfile';
import QuestsComponent from './QuestsComponent';
import ConnectionsComponent from './ConnectionsComponent';
import HistorySection from './HistorySection';
import NavigationBar from './NavigationBar';
import { useNotification } from '../NotificationContext';
import { checkAuthStatus, handleLogout } from './UserAuthService';
import { doc, getDoc } from 'firebase/firestore';

const HomeScreen = () => {
  const [activeSection, setActiveSection] = useState('');
  const [currentUserIds, setCurrentUserIds] = useState([]);
  const [address, setAddress] = useState('Loading address...');
  const [map, setMap] = useState(null);
  const [lockedUser, setLockedUser] = useState(null);
  const [lockedUserData, setLockedUserData] = useState(null);

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

  const renderSection = () => {
    switch(activeSection) {
      case 'profile':
        return <UserProfile />;
      case 'quests':
        return <QuestsComponent currentUserIds={currentUserIds} map={map} />;
      case 'connections':
        return <ConnectionsComponent 
          currentUserIds={currentUserIds}
          map={map}
          lockedUser={lockedUser}
          setLockedUser={handleSetLockedUser}
          lockedUserData={lockedUserData}
        />;
      case 'history':
        return <HistorySection currentUser={auth.currentUser} />;
      default:
        return null;
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

  return (
    <div className="home-screen-container">
      <NavigationBar 
        activeSection={activeSection} 
        showSection={showSection} 
        handleLogout={handleLogoutClick}
      />
      <div className={`main-content ${activeSection === 'profile' ? 'profile-active' : ''}`}>
        <div className="content-area">
          {renderSection()}
        </div>
        <div className="map-container">
          <MapComponent 
            address={address} 
            setAddress={setAddress} 
            setCurrentUserIds={setCurrentUserIds}
            setMap={setMap}
            activeSection={activeSection}
            lockedUser={lockedUser}
          />
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;