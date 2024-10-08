import React from 'react';
import './TopBar.css';
import { CreateQuestButton, Filter, Search } from '../../pages/MainPage';
import Map from '../map/Map';

function TopBar({ ref, show }) {
  return (
    <div className="top-bar-container" style={{ opacity: show ? 1 : 0 }}>
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
