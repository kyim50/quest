import React, { useState, useEffect } from 'react';
import { auth, db, updateDoc, doc } from '../firebase';
import { useNotification } from '../NotificationContext'; // Import useNotification
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faUnlock } from '@fortawesome/free-solid-svg-icons';
import '../styles/mapstyles.css';
import '../styles/profile.css';

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
    <div className="privacy-settings" onClick={handlePrivacyToggle}>
      <FontAwesomeIcon icon={isPrivateMode ? faLock : faUnlock} />
    </div>
  );
};

export default Privacy;
