import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import '../styles/mapstyles.css';
import MapComponent from './MapComponent';
import UserProfile from './UserProfile';
import QuestsComponent from './QuestsComponent';
import ConnectionsComponent from './ConnectionsComponent';
import HistorySection from './HistorySection'; // Make sure this import is correct
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

  const renderSection = () => {
    switch(activeSection) {
      case 'profile-section':
        return <UserProfile />;
      case 'quests-section':
        return (
          <QuestsComponent 
            isOpen={isQuestWindowOpen} 
            quests={quests} 
            currentUserIds={currentUserIds} 
            map={map}
          />
        );
      case 'connections-section':
        return <ConnectionsComponent currentUserIds={currentUserIds} />;
      case 'history-section':
        console.log('Rendering HistorySection');
        console.log('HistorySection component:', HistorySection);
        return HistorySection ? <HistorySection currentUser={auth.currentUser} /> : <div>History Section not available</div>;
      default:
        return null;
    }
  };

  return (
    <div className="map-container">
      <div className="logout-container">
        <button className="logout-btn" onClick={() => handleLogout(navigate, showNotification)}>
          <img src="/logout.png" alt="Log Out" />
        </button>
      </div>

      <div className="adventure-btn-container">
        <button className="add-adventure-btn" onClick={() => navigate('/adventure-feed')}>
          +
        </button>
      </div>

      <MapComponent 
        address={address} 
        setAddress={setAddress} 
        setCurrentUserIds={setCurrentUserIds}
        setMap={setMap}
      />

      <div className={`rectangular-container ${activeSection ? '' : 'hidden'}`} id="content-container">
        {renderSection()}
      </div>

      <NavigationBar activeSection={activeSection} showSection={showSection} />
    </div>
  );
};

export default HomeScreen;