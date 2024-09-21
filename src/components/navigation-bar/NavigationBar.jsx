import React from 'react';
import { Link } from 'react-router-dom';
import './NavigationBar.css';

import HomeIcon from '../../assets/icons/home_24dp_E8EAED_FILL1_wght400_GRAD0_opsz24.svg?react';

function NavigationBar() {
  return (
    <div className="navigation-bar-container">
      <div className="navigation-bar">
        <NavigationButton>
          <HomeIcon />
        </NavigationButton>
        <NavigationButton></NavigationButton>
        <NavigationButton></NavigationButton>
      </div>
    </div>
  );
}

function NavigationButton(props) {
  return (
    <Link className="navigation-bar-button" to={props.link}>
      {props.children}
    </Link>
  );
}

export default NavigationBar;
