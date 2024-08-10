import { auth } from '../firebase';
import { setUserIsActive } from './UserLocationService';

export const checkAuthStatus = (navigate) => {
  return auth.onAuthStateChanged(user => {
    if (user) {
      setUserIsActive(true);
    } else {
      setUserIsActive(false);
      navigate('/login');
    }
  });
};

export const handleLogout = (navigate, showNotification) => {
  if (auth.currentUser) {
    setUserIsActive(false)
      .then(() => {
        localStorage.clear();
        auth.signOut().then(() => {
          navigate('/login');
        }).catch((error) => {
          console.error('Error signing out:', error);
          showNotification('Error signing out', 'error');
        });
      });
  } else {
    localStorage.clear();
    auth.signOut().then(() => {
      navigate('/login');
    }).catch((error) => {
      console.error('Error signing out:', error);
      showNotification('Error signing out', 'error');
    });
  }
};

// ... (other auth-related functions)