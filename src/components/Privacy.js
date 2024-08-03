import React, { useState, useEffect } from 'react';
import { auth, db, updateDoc, doc } from '../firebase';
import { useNotification } from '../NotificationContext'; // Import useNotification
import '../styles/mapstyles.css';

export const Privacy = ({ isPrivate = false, onPrivacyModeChange }) => {
  const [isPrivateMode, setIsPrivateMode] = useState(isPrivate);
  const { showNotification } = useNotification();

  useEffect(() => {
    setIsPrivateMode(isPrivate);
  }, [isPrivate]);

  const handlePrivacyToggle = async () => {
    try {
      const newIsPrivate = !isPrivateMode;
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDocRef, { isPrivate: newIsPrivate });
      setIsPrivateMode(newIsPrivate);

      // Check if onPrivacyModeChange is a function before calling it
      if (typeof onPrivacyModeChange === 'function') {
        onPrivacyModeChange(newIsPrivate);
      } else {
        console.error('onPrivacyModeChange is not a function');
      }

      showNotification('Privacy settings updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      showNotification('Error updating privacy settings', 'error');
    }
  };

  return (
    <div className="privacy-settings">
      <label className="privacy-label">
        <input
          type="checkbox"
          checked={isPrivateMode}
          onChange={handlePrivacyToggle}
          className="privacy-checkbox"
        />
        <span className="privacy-slider"></span>
        <span className="privacy-text">Private Mode</span>
      </label>
    </div>
  );
};

export default Privacy;
