import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';

const UserStatusContext = createContext();

export const useUserStatus = () => useContext(UserStatusContext);

export const UserStatusProvider = ({ children }) => {
  const [userStatus, setUserStatus] = useState('offline');
  const [lastActiveTime, setLastActiveTime] = useState(Date.now());

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        setUserStatus('online');
        setLastActiveTime(Date.now());
        updateUserStatusInFirestore(user.uid, 'online');
        setupActivityTracking(user.uid);
      } else {
        setUserStatus('offline');
        setLastActiveTime(Date.now());
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  const setupActivityTracking = (userId) => {
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const updateActivity = () => {
      setLastActiveTime(Date.now());
      if (userStatus !== 'online') {
        setUserStatus('online');
        updateUserStatusInFirestore(userId, 'online');
      }
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    const checkIdleStatus = setInterval(() => {
      const currentTime = Date.now();
      if (currentTime - lastActiveTime > 3 * 60 * 1000) { // 3 minutes
        setUserStatus('idle');
        updateUserStatusInFirestore(userId, 'idle');
      }
    }, 60 * 1000); // Check every minute

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setUserStatus('offline');
        updateUserStatusInFirestore(userId, 'offline');
      } else {
        setUserStatus('online');
        setLastActiveTime(Date.now());
        updateUserStatusInFirestore(userId, 'online');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(checkIdleStatus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  };

  const updateUserStatusInFirestore = async (userId, status) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { status });
    } catch (error) {
      console.error('Error updating user status in Firestore:', error);
    }
  };

  useEffect(() => {
    if (auth.currentUser) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const unsubscribe = onSnapshot(userRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          if (userData.activeQuest) {
            setUserStatus('on quest');
          }
        }
      });

      return () => unsubscribe();
    }
  }, []);

  return (
    <UserStatusContext.Provider value={{ userStatus, setUserStatus }}>
      {children}
    </UserStatusContext.Provider>
  );
};