import React from 'react';
import { useNotification } from './NotificationContext';
import './NotificationDisplay.css'; // Ensure this path is correct

const NotificationDisplay = () => {
  const { notifications } = useNotification();

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <div key={notification.id} className={`notification ${notification.type} ${notification.show ? 'show' : 'hide'}`}>
          {notification.message}
        </div>
      ))}
    </div>
  );
};

export default NotificationDisplay;
