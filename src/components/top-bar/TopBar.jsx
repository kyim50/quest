import React from 'react';
import './TopBar.css';
import { CreateQuestButton, Filter, Search } from '../../pages/MainPage';
import Map from '../map/Map';

function TopBar() {
  return (
    <div className="top-bar-container">
      <div className="top-bar">
        <Search small />
        <CreateQuestButton small />
        <Filter small />
        <Map small />
      </div>
    </div>
  );
}

export default TopBar;
