import React from 'react';
import './MainPage.css';
import NavigationBar from '../components/navigation-bar/NavigationBar';
import Feed from '../components/feed/Feed';
import Map from "../components/map/Map"

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
        <div></div>
      </div>
    </div>
  );
}

const dummyQuests = {

}

export default MainPage;
