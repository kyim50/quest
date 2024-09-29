import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './NavigationBar.css';
import { useUser } from '../UserProvider'; // Import the useUser hook

import HomeIcon from '../../assets/icons/home_24dp_E8EAED_FILL1_wght400_GRAD0_opsz24.svg?react';
import CameraIcon from '../../assets/icons/photo_camera_24dp_E8EAED_FILL1_wght400_GRAD0_opsz24.svg?react';
import SocialIcon from '../../assets/icons/supervised_user_circle_24dp_E8EAED_FILL1_wght400_GRAD0_opsz24.svg?react';
import QuestsIcon from '../../assets/icons/not_listed_location_24dp_E8EAED_FILL0_wght400_GRAD0_opsz24.svg?react';

function NavigationBar() {
  const [currPage, setCurrPage] = useState('/home');
  const currentUser = useUser(); // Use the useUser hook to get the current user data

  return (
    <div className="navigation-bar-container">
      <div className="navigation-bar">
        <NavigationButton link={'/home'}>
          <HomeIcon />
        </NavigationButton>
        <NavigationButton link={'camera'}>
          <CameraIcon />
        </NavigationButton>
        <NavigationButton link={'profile'} replace>
          {/* Profile icon with user's image */}
          <div className="profile-icon">
            <img
              src={currentUser?.profilePhoto || '/default-profile-image.jpg'}
              alt={currentUser?.name || 'User Profile'}
              className="profile-photo"
            />
          </div>
        </NavigationButton>
        <NavigationButton link={'connections'} replace>
          <SocialIcon />
        </NavigationButton>
        <NavigationButton link={'quests'} replace>
          <QuestsIcon />
        </NavigationButton>
      </div>
    </div>
  );

  function NavigationButton({ link, children, replace = false }) {
    const isSelected = link === currPage;

    return (
      <NavLink
        end
        className={({ isActive }) => {
          return `navigation-bar-button ${isActive ? 'selected' : ''}`;
        }}
        id={link}
        to={link}
        replace={replace}
        onClick={() => setCurrPage(link)}
      >
        {children}
      </NavLink>
    );
  }
}

export default NavigationBar;
