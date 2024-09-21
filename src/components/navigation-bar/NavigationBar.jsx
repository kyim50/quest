import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './NavigationBar.css';

import HomeIcon from '../../assets/icons/home_24dp_E8EAED_FILL1_wght400_GRAD0_opsz24.svg?react';
import CameraIcon from '../../assets/icons/photo_camera_24dp_E8EAED_FILL1_wght400_GRAD0_opsz24.svg?react';
import ProfileIcon from '../../assets/icons/supervised_user_circle_24dp_E8EAED_FILL1_wght400_GRAD0_opsz24.svg?react';

function NavigationBar() {
  const [currPage, setCurrPage] = useState('home');

  return (
    <div className="navigation-bar-container">
      <div className="navigation-bar">
        <NavigationButton type={'home'}>
          <HomeIcon />
        </NavigationButton>
        <NavigationButton type={'camera'}>
          <CameraIcon />
        </NavigationButton>
        <NavigationButton type={'profile'}>
          <ProfileIcon />
        </NavigationButton>
      </div>
    </div>
  );

  function NavigationButton({ type, children, link }) {
    const isSelected = type === currPage;

    return (
      <Link
        className={`navigation-bar-button ${isSelected ? 'selected' : ''}`}
        to={link}
        onClick={() => setCurrPage(type)}
      >
        {children}
      </Link>
    );
  }
}

export default NavigationBar;
