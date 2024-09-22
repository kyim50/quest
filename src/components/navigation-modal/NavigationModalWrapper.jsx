import React from 'react';
import './NavigationModal.css';

import UserProfile from '../UserProfile';
import PhotoUploadPreview from '../PhotoUploadPreview';

function NavigationModalWrapper({ children }) {
  return <div className="navigation-modal-container">{children}</div>;
}

export default NavigationModalWrapper;
