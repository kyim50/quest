import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import '../styles/mapstyles.css';
import MapComponent from './MapComponent';
import UserProfile from './UserProfile';
import QuestsComponent from './QuestsComponent';
import ConnectionsComponent from './ConnectionsComponent';
import NavigationBar from './NavigationBar';
import { useNotification } from '../NotificationContext';
import { checkAuthStatus, handleLogout } from './UserAuthService';

const HomeScreen = () => {
  const [activeSection, setActiveSection] = useState('');
  const [isQuestWindowOpen, setIsQuestWindowOpen] = useState(false);
  const [currentUserIds, setCurrentUserIds] = useState([]);
  const [quests, setQuests] = useState([]);
  const [address, setAddress] = useState('Loading address...');
  const [map, setMap] = useState(null);

  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    const unsubscribeAuth = checkAuthStatus(navigate);
    return () => unsubscribeAuth();
  }, [navigate]);

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

  return (
    <div className="map-container">
      <div className="logout-container">
        <button className="logout-btn" onClick={() => handleLogout(navigate, showNotification)}>
          <img src="/logout.png" alt="Log Out" />
        </button>
      </div>
      <MapComponent 
        address={address} 
        setAddress={setAddress} 
        setCurrentUserIds={setCurrentUserIds}
        setMap={setMap}
      />
      <div className={`rectangular-container ${activeSection ? '' : 'hidden'}`} id="content-container">
        {activeSection === 'profile-section' && <UserProfile />}
        {activeSection === 'quests-section' && (
          <QuestsComponent 
            isOpen={isQuestWindowOpen} 
            quests={quests} 
            currentUserIds={currentUserIds} 
            map={map}
          />
        )}
        {activeSection === 'connections-section' && <ConnectionsComponent currentUserIds={currentUserIds} />}
      </div>
      <NavigationBar activeSection={activeSection} showSection={showSection} />
    </div>
  );
};

export default HomeScreen;