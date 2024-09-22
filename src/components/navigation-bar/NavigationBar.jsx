import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './NavigationBar.css';

import HomeIcon from '../../assets/icons/home_24dp_E8EAED_FILL1_wght400_GRAD0_opsz24.svg?react';
import CameraIcon from '../../assets/icons/photo_camera_24dp_E8EAED_FILL1_wght400_GRAD0_opsz24.svg?react';
import SocialIcon from '../../assets/icons/supervised_user_circle_24dp_E8EAED_FILL1_wght400_GRAD0_opsz24.svg?react';
import QuestsIcon from '../../assets/icons/not_listed_location_24dp_E8EAED_FILL0_wght400_GRAD0_opsz24.svg?react'

function NavigationBar() {
  const [currPage, setCurrPage] = useState('/home');

  return (
    <div className="navigation-bar-container">
      <div className="navigation-bar">
        <NavigationButton type={'/home'}>
          <HomeIcon />
        </NavigationButton>
        <NavigationButton type={'camera'}>
          <CameraIcon />
        </NavigationButton>
        <NavigationButton type={'profile'}>
            <div className='profile-icon'></div>
        </NavigationButton>
        <NavigationButton type={'connections'}>
          <SocialIcon />
        </NavigationButton>
        <NavigationButton type={'quests'}>
          <QuestsIcon />
        </NavigationButton>
      </div>
    </div>
  );

  function NavigationButton({ type, children }) {
    const isSelected = type === currPage;

    return (
      <Link
        className={`navigation-bar-button ${isSelected ? 'selected' : ''}`}
        to={type}
        onClick={() => setCurrPage(type)}
      >
        {children}
      </Link>
    );
  }
}

export default NavigationBar;
