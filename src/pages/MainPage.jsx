import React, { useState } from 'react';
import './MainPage.css';

import { Routes, Route } from 'react-router-dom';
import { useMediaQuery } from 'react-responsive';

import NavigationBar from '../components/navigation-bar/NavigationBar';
import NavigationModal from '../components/navigation-modal/NavigationModalWrapper';
import Feed from '../components/feed/Feed';
import Map from '../components/map/Map';
import UserProfile from '../components/UserProfile';
import QuestsComponent from '../components/QuestsComponent';
import Connections from '../components/Connections';
import PrivacySection from '../components/PrivacySection';
import TopBar from '../components/top-bar/TopBar';

import SearchIcon from '../assets/icons/search_24dp_E8EAED_FILL1_wght400_GRAD0_opsz24.svg?react';
import DropDownIcon from '../assets/icons/arrow_drop_down_24dp_E8EAED_FILL1_wght400_GRAD0_opsz24.svg?react';
import CreateQuestIcon from '../assets/icons/new_window_24dp_E8EAED_FILL1_wght400_GRAD0_opsz24.svg?react';

function MainPage() {
  const isFirstBreak = useMediaQuery({ query: '(max-width: 800px)' });
  const isMobileBreak = useMediaQuery({ query: '(max-width: 550px)' });

  return (
    <div className="main-page">
      {isMobileBreak && <TopBar />}
      <div className="left-panel">
        <NavigationBar />
        <Routes>
          <Route path="profile" element={<UserProfile />} />
          <Route path="connections" element={<Connections />} />
          <Route path="quests" element={<QuestsComponent />} />
        </Routes>
      </div>
      <div className="body-section">
        <div className="middle-panel">
          <Feed />
        </div>
        <div className="right-panel">
          <Map />
          <div className="button-section">
            {isFirstBreak ? (
              <>
                <Search />
                <CreateQuestButton />
                <Filter />
              </>
            ) : (
              <>
                <div className="actions-container">
                  <Search />
                  <Filter />
                </div>
                <CreateQuestButton />
              </>
            )}
          </div>
        </div>
      </div>
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

export function CreateQuestButton({ small = false }) {
  return (
    <button className={`create-button ${small && 'small'}`}>
      <div className="icon-container">
        <CreateQuestIcon />
      </div>
      {!small && 'Create Quest'}
    </button>
  );
}

export default MainPage;
