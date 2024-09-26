import React, { useState } from 'react';
import './Map.css';
import MapComponent from '././MapComponent';

function Map({ small = false }) {
  const [address, setAddress] = useState('Loading address...');
  const [currentUserIds, setCurrentUserIds] = useState([]);
  const [map, setMap] = useState(null);
  const [activeSection, setActiveSection] = useState('');
  const [lockedUser, setLockedUser] = useState(null);

  return (
    <div className={`map-container ${small && 'small'}`}>
      <MapComponent
        address={address}
        setAddress={setAddress}
        setCurrentUserIds={setCurrentUserIds}
        setMap={setMap}
        activeSection={activeSection}
        lockedUser={lockedUser}
        showAddressBar={false}
        isFullScreen={false}
      />
    </div>
  );
}

export default Map;
