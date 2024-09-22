import React from 'react';
import './NavigationModal.css';

import UserProfile from '../UserProfile';
import QuestsComponent from '../QuestsComponent';
import Connections from '../Connections';
import PrivacySection from '../PrivacySection';
import PhotoUploadPreview from '../PhotoUploadPreview';

function NavigationModal() {
  return (
    <div className="navigation-modal-container">
      <UserProfile />
    </div>
  );
}

export default NavigationModal;
