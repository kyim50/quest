import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db } from './firebase'; // Import your firebase configuration
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import './NotificationDisplay.css'; // Ensure this path is correct

const NotificationContext = createContext();

export const useNotification = () => {
  return useContext(NotificationContext);
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [initialLoadTime, setInitialLoadTime] = useState(null);

  useEffect(() => {
    // Set the initial load time when the component mounts
    setInitialLoadTime(Date.now());
  }, []);

  useEffect(() => {
    // Make sure initialLoadTime is set before setting up the listener
    if (initialLoadTime) {
      const questsCollection = collection(db, 'quests');
      const q = query(questsCollection, where('createdAt', '>', new Date(initialLoadTime)));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const questData = change.doc.data();
            showNotification(`New quest available: ${questData.title}`, 'info');
          }
        });
      });

      return () => unsubscribe();
    }
  }, [initialLoadTime]);

  const showNotification = useCallback((message, type) => {
    const id = Date.now();
    setNotifications((prevNotifications) => [
      ...prevNotifications,
      { id, message, type, show: true }
    ]);

    setTimeout(() => {
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === id ? { ...notification, show: false } : notification
        )
      );
    }, 3000);

    setTimeout(() => {
      setNotifications((prevNotifications) =>
        prevNotifications.filter(notification => notification.id !== id)
      );
    }, 3500); // Allow time for the fade-out transition
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, showNotification }}>
      {children}
      <div className="notification-container">
        {notifications.map((notification) => (
          <div key={notification.id} className={`notification ${notification.type} ${notification.show ? 'show' : 'hide'}`}>
            {notification.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
