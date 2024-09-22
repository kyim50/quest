import React, { useState } from 'react';
import './MainPage.css';

import { Routes, Route } from 'react-router-dom';

import NavigationBar from '../components/navigation-bar/NavigationBar';
import NavigationModal from '../components/navigation-modal/NavigationModalWrapper';
import Feed from '../components/feed/Feed';
import Map from '../components/map/Map';
import UserProfile from '../components/UserProfile';
import QuestsComponent from '../components/QuestsComponent';
import Connections from '../components/Connections';
import PrivacySection from '../components/PrivacySection';

import SearchIcon from '../assets/icons/search_24dp_E8EAED_FILL1_wght400_GRAD0_opsz24.svg?react';
import DropDownIcon from '../assets/icons/arrow_drop_down_24dp_E8EAED_FILL1_wght400_GRAD0_opsz24.svg?react';
import CreateQuestIcon from '../assets/icons/new_window_24dp_E8EAED_FILL1_wght400_GRAD0_opsz24.svg?react';
import Quests from '../components/Quests';

function MainPage() {
  return (
    <div className="main-page">
      <div className="left-panel">
        <NavigationBar />
        <Routes>
            <Route path="profile" element={<UserProfile/>}/>
            <Route path="connections" element={<Connections/>}/>
            <Route path="quests" element={<QuestsComponent/>}/>
        </Routes>
      </div>
      <div className="middle-panel">
        <Feed />
      </div>
      <div className="right-panel">
        <Map />
        <div className="actions-container">
          <Search />
          <Filter />
        </div>
        <CreateQuestButton />
      </div>
    </div>
  );
}

function Search() {
  return (
    <div className="search">
      <SearchIcon />
      <input className="search-input" type="text" placeholder="Search" />
    </div>
  );
}
function Filter() {
  const [filter, setFilter] = useState('Near You');

  return (
    <button className="filter-button">
      <DropDownIcon />
      {filter}
    </button>
  );
}

function CreateQuestButton() {
  return (
    <button className="create-button">
      <CreateQuestIcon />
      Create Quest
    </button>
  );
}

export default MainPage;
