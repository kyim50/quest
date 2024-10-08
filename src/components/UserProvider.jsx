import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, fetchUserData } from '../firebase';

const UserContext = createContext();

export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userData = await fetchUserData(user.uid);
        console.log('Fetched user data:', userData); // Add this line
        setCurrentUser(userData);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={currentUser}>
      {loading ? <div></div> : children}
    </UserContext.Provider>
  );
};
