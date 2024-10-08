import React from 'react';
import './NavigationModal.css';
import { Link } from 'react-router-dom';

import UserProfile from '../../pages/UserProfile';
import PhotoUploadPreview from '../PhotoUploadPreview';

function NavigationModalWrapper({ children }) {
  return (
    <div className="navigation-modal-container">
      <Link className='navigation-modal-bg' to={"/home"}/>
      <div className="navigation-modal">{children}</div>
    </div>
  );
}

export default NavigationModalWrapper;
