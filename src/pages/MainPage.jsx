import React, { useState } from 'react';
import './MainPage.css';

import NavigationBar from '../components/navigation-bar/NavigationBar';
import Feed from '../components/feed/Feed';
import Map from '../components/map/Map';

import SearchIcon from '../assets/icons/search_24dp_E8EAED_FILL1_wght400_GRAD0_opsz24.svg?react';
import DropDownIcon from '../assets/icons/arrow_drop_down_24dp_E8EAED_FILL1_wght400_GRAD0_opsz24.svg?react';
import CreateQuestIcon from '../assets/icons/new_window_24dp_E8EAED_FILL1_wght400_GRAD0_opsz24.svg?react';

function MainPage() {
  return (
    <div className="main-page">
      <div className="left-panel">
        <NavigationBar />
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
