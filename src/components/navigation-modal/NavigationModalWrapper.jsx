import React from 'react';
import './NavigationModal.css';

import UserProfile from '../UserProfile';
import PhotoUploadPreview from '../PhotoUploadPreview';

function NavigationModalWrapper({ children }) {
  return (
    <div className="navigation-modal-container">
      <div className="navigation-modal">{children}</div>
    </div>
  );
}

export default NavigationModalWrapper;
