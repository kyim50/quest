import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, fetchUserData } from '../firebase';

const UserContext = createContext();

export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      if (auth.currentUser) {
        const userData = await fetchUserData(auth.currentUser.uid);
        setCurrentUser(userData);
      }
    };

    fetchUser();
  }, []);

  return (
    <UserContext.Provider value={currentUser}>
      {children}
    </UserContext.Provider>
  );
};
