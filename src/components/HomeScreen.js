import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import '../styles/mapstyles.css';
import MapComponent from './MapComponent';
import UserProfile from './UserProfile';
import QuestsComponent from './QuestsComponent';
import ConnectionsComponent from './ConnectionsComponent';
import HistorySection from './HistorySection';
import NavigationBar from './NavigationBar';
import { useNotification } from '../NotificationContext';
import { checkAuthStatus, handleLogout } from './UserAuthService';

const HomeScreen = () => {
  const [activeSection, setActiveSection] = useState('');
  const [currentUserIds, setCurrentUserIds] = useState([]);
  const [address, setAddress] = useState('Loading address...');
  const [map, setMap] = useState(null);

  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    const unsubscribeAuth = checkAuthStatus(navigate);
    return () => unsubscribeAuth();
  }, [navigate]);

  const showSection = (sectionId) => {
    setActiveSection(sectionId === activeSection ? '' : sectionId);
  };

  const renderSection = () => {
    switch(activeSection) {
      case 'profile':
        return <UserProfile />;
      case 'quests':
        return <QuestsComponent currentUserIds={currentUserIds} map={map} />;
      case 'connections':
        return <ConnectionsComponent currentUserIds={currentUserIds} />;
      case 'history':
        return <HistorySection currentUser={auth.currentUser} />;
      default:
        return null;
    }
  };

  return (
    <div className="home-screen-container">
      <NavigationBar activeSection={activeSection} showSection={showSection} />
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
            activeSection={activeSection}  // Pass activeSection to MapComponent
          />
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;