import React, { useState } from 'react';
import './Map.css';
import MapComponent from '././MapComponent';
import BackIcon from '../../assets/icons/back-icon.svg?react';

function Map({ small = false }) {
  const [address, setAddress] = useState('Loading address...');
  const [currentUserIds, setCurrentUserIds] = useState([]);
  const [map, setMap] = useState(null);
  const [activeSection, setActiveSection] = useState('');
  const [lockedUser, setLockedUser] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div
      className={`map-container ${small ? 'small' : ''} ${
        isFullScreen ? 'full-screen' : ''
      }`}
      onClick={() => {
        !isFullScreen && setIsFullScreen(true);
      }}
    >
      <MapComponent
        address={address}
        setAddress={setAddress}
        setCurrentUserIds={setCurrentUserIds}
        setMap={setMap}
        activeSection={activeSection}
        lockedUser={lockedUser}
        showAddressBar={false}
        isFullScreen={isFullScreen}
      />

      {isFullScreen && (
        <button
          className="full-screen-toggle"
          onClick={() => setIsFullScreen(false)}
          aria-label={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
        >
          <BackIcon />
        </button>
      )}
    </div>
  );
}

export default Map;
