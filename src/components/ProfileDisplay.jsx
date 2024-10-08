import React, { useMemo } from 'react';

const ProfileDisplay = ({ currentUser }) => {
  const memoizedProfileDisplay = useMemo(() => (
    <div className="profile-display">
      <div className="profile-photo-container">
        <img 
          src={currentUser?.profilePhoto || '/default-profile-image.jpg'} 
          alt={currentUser?.name || 'Profile'}
          className="profile-photo" 
        />
      </div>
      <div className="profile-name-status">
        <h2 className="profile-name">{currentUser?.name || 'Loading...'}</h2>
        <p className="profile-status">
          <span className="status-dot"></span>
          Active now
        </p>
      </div>
    </div>  
  ), [currentUser]);

  return memoizedProfileDisplay;
};

export default ProfileDisplay;