import React, { useEffect, useRef, useState } from 'react';
import './MainPage.css';

import { Routes, Route } from 'react-router-dom';
import { useMediaQuery } from '@mui/system';

import NavigationBar from '../components/navigation-bar/NavigationBar';
import NavigationModal from '../components/navigation-modal/NavigationModalWrapper';
import Feed from '../components/feed/Feed';
import Map from '../components/map/Map';
import UserProfile from './UserProfile';
import Quests from '../pages/Quests';
import Connections from './Connections';
import PrivacySection from '../components/PrivacySection';
import TopBar from '../components/top-bar/TopBar';
import CreateQuestModal from '../components/CreateQuestModal';
import CameraOverlay from '../pages/CameraOverlay';

import SearchIcon from '../assets/icons/search_24dp_E8EAED_FILL1_wght400_GRAD0_opsz24.svg?react';
import DropDownIcon from '../assets/icons/arrow_drop_down_24dp_E8EAED_FILL1_wght400_GRAD0_opsz24.svg?react';
import CreateQuestIcon from '../assets/icons/not_listed_location_24dp_E8EAED_FILL0_wght400_GRAD0_opsz24.svg?react';
import Settings from './Settings';

function MainPage() {
  const isFirstBreak = useMediaQuery('(max-width:800px)');
  const isMobileBreak = useMediaQuery('(max-width:550px)');
  const topSectionRef = useRef(null);

  const [showTopBar, setShowTopBar] = useState(false);
  const [isCreateQuestOpen, setIsCreateQuestOpen] = useState(false);
  const [showCameraOverlay, setShowCameraOverlay] = useState(false);
  const [showCamera, setShowCamera] = React.useState(false);

  const handleCameraToggle = () => {
    setShowCamera((prev) => !prev);
  };

  useEffect(() => {
    const handleScroll = () => {
      console.debug('scroll');
      if (topSectionRef.current) {
        const rect = topSectionRef.current.getBoundingClientRect();
        setShowTopBar(rect.bottom < 48);
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, []);

  const handleCreateQuestClick = () => {
    setIsCreateQuestOpen(true);
  };

  return (
    <div className="main-page">
      {isMobileBreak && <TopBar show={showTopBar} />}
      <div className="left-panel">
        <NavigationBar />
        <Routes>
          <Route path="profile" element={<UserProfile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="connections" element={<Connections />} />
          <Route path="camera" element={<CameraOverlay />} />
          <Route
            path="quests"
            element={
              <Quests
                isCreateQuestOpen={isCreateQuestOpen}
                setIsCreateQuestOpen={setIsCreateQuestOpen}
              />
            }
          />
        </Routes>
      </div>
      <div className="body-section">
        <div className="middle-panel">
          <Feed />
        </div>
        <div className="right-panel" ref={topSectionRef}>
          <div className="right-panel right-panel-sticky">
            <Map />
            <div className="button-section">
              {isFirstBreak ? (
                <>
                  <Search />
                  <CreateQuestButton onClick={handleCreateQuestClick} />
                  <Filter />
                </>
              ) : (
                <>
                  <div className="actions-container">
                    <Search />
                    <Filter />
                  </div>
                  <CreateQuestButton onClick={handleCreateQuestClick} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {isCreateQuestOpen && (
        <CreateQuestModal
          isOpen={isCreateQuestOpen}
          onClose={() => setIsCreateQuestOpen(false)}
        />
      )}
    </div>
  );
}

export function Search({ small = false }) {
  return (
    <div className={`search ${small && 'small'}`}>
      <div className="icon-container">
        <SearchIcon />
      </div>
      {!small && (
        <input className="search-input" type="text" placeholder="Find Quests" />
      )}
    </div>
  );
}

export function Filter({ small = false }) {
  const [filter, setFilter] = useState('Near You');

  return (
    <button className={`filter-button ${small && 'small'}`}>
      <div className="icon-container">
        <DropDownIcon />
      </div>
      {filter}
    </button>
  );
}

export function CreateQuestButton({ small = false, onClick }) {
  return (
    <button className={`create-button ${small && 'small'}`} onClick={onClick}>
      <div className="icon-container">
        <CreateQuestIcon />
      </div>
      {!small && 'Create Quest'}
    </button>
  );
}

export default MainPage;
