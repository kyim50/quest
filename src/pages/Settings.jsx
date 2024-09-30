import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

import { auth, db } from '../firebase';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

import PrivacyIcon from '../assets/icons/visibility.svg?react';
import PrivacyDisableIcon from '../assets/icons/visibility-disabled.svg?react';
import FriendsIcon from '../assets/icons/friends.svg?react';

import NavigationModalWrapper from '../components/navigation-modal/NavigationModalWrapper';
import Privacy from '../components/Privacy';
import BackIcon from '../assets/icons/back-icon.svg?react';
import CheckIcon from '../assets/icons/check_24dp_E8EAED_FILL0_wght500_GRAD0_opsz24.svg?react';
import UncheckIcon from '../assets/icons/cancel.svg?react';
import DarkIcon from '../assets/icons/darktheme.svg?react';
import LightIcon from '../assets/icons/lighttheme.svg?react';
import PrivacySection from '../components/PrivacySection';

import { toggleTheme, getCurrentTheme } from '../theme-toggle';

function Settings() {
  const navigate = useNavigate();
  const [currentTheme, setCurrentTheme] = useState(getCurrentTheme());

  const handleThemeToggle = () => {
    toggleTheme();
    setCurrentTheme(getCurrentTheme());
  };

  useEffect(() => {
    const handleThemeChange = (event) => {
      setCurrentTheme(event.detail.isLightMode ? 'light' : 'dark');
    };
    window.addEventListener('themeChanged', handleThemeChange);
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);

  return (
    <NavigationModalWrapper>
      <div className="settings-container">
        <header>
          <BackIcon onClick={() => navigate('/home/profile')} />
          <h2>Settings</h2>
        </header>
        <section>
          <h3>Privacy</h3>
          <PrivacySetings />
        </section>
        <section>
          <h3>Theme</h3>
          <div className="setting-option" onClick={handleThemeToggle}>
            <div>
              <p>{currentTheme === 'light' ? 'Light' : 'Dark'}</p>
            </div>
            <div className="setting-icons">
              {currentTheme === 'light' ? <LightIcon /> : <DarkIcon />}
            </div>
          </div>
        </section>
      </div>
    </NavigationModalWrapper>
  );
}

function PrivacySetings() {
  const [privacySettings, setPrivacySettings] = useState({
    friendsCanSeeLocation: true,
    quietMap: false,
    canSeeOtherMarkers: true,
    useCustomVisibilityList: false,
  });
  const [locationPrivacyToggle, setLocationPrivacyToggle] = useState(1);
  const [customList, setCustomList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // New state for managing the container height
  const [containerHeight, setContainerHeight] = useState(
    window.innerHeight * 0.5
  );

  useEffect(() => {
    fetchPrivacySettings();
  }, []);

  useEffect(() => {
    const newToggle = (privacySettings.friendsCanSeeLocation ? 1 : 0) + (privacySettings.quietMap ? 2 : 0);
    setLocationPrivacyToggle(newToggle);
  }, [privacySettings.friendsCanSeeLocation, privacySettings.quietMap]);

  const fetchPrivacySettings = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();
      setPrivacySettings(
        userData.privacySettings || {
          friendsCanSeeLocation: true,
          quietMap: false,
          canSeeOtherMarkers: true,
          useCustomVisibilityList: false,
        }
      );

      setCustomList(userData.customVisibilityList || []);
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
    }
  };

  const handleLocationSwitch = () => {
    const newToggle = (locationPrivacyToggle + 1) % 4;
    setLocationPrivacyToggle(newToggle);

    switch (newToggle) {
      case 0:
        updatePrivacySetting('friendsCanSeeLocation', false);
        updatePrivacySetting('quietMap', false);
        break;
      case 1:
        updatePrivacySetting('friendsCanSeeLocation', true);
        updatePrivacySetting('quietMap', false);
        break;
      case 2:
        updatePrivacySetting('friendsCanSeeLocation', false);
        updatePrivacySetting('quietMap', true);
        break;
      case 3:
        updatePrivacySetting('friendsCanSeeLocation', true);
        updatePrivacySetting('quietMap', true);
        break;
    }
  };

  const updatePrivacySetting = async (setting, value) => {
    try {
      const newSettings = { ...privacySettings, [setting]: value };
      setPrivacySettings(newSettings);
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        privacySettings: newSettings,
      });
    } catch (error) {
      console.error('Error updating privacy setting:', error);
    }
  };

  const handleSearch = async (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value.length > 2) {
      try {
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          where('username', '>=', e.target.value),
          where('username', '<=', e.target.value + '\uf8ff')
        );
        const querySnapshot = await getDocs(q);
        const results = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching users:', error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleAddCustomUser = async (user) => {
    if (user && !customList.some((u) => u.id === user.id)) {
      const newList = [...customList, user];
      setCustomList(newList);
      setSearchTerm('');
      setSearchResults([]);
      try {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          customVisibilityList: newList,
        });
      } catch (error) {
        console.error('Error updating custom list:', error);
      }
    }
  };

  const handleRemoveCustomUser = async (userId) => {
    const newList = customList.filter((u) => u.id !== userId);
    setCustomList(newList);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        customVisibilityList: newList,
      });
    } catch (error) {
      console.error('Error updating custom list:', error);
    }
  };

  return (
    <div>
      <div className="setting-option">
        <div>
          <p>Location Visibility</p>
          <span>Only Friends can see my Location</span>
        </div>
        <div className="setting-icons" onClick={handleLocationSwitch}>
          {locationPrivacyToggle === 0 && <PrivacyIcon />}
          {locationPrivacyToggle === 1 && <><PrivacyIcon /><FriendsIcon /></>}
          {locationPrivacyToggle === 2 && <PrivacyDisableIcon />}
          {locationPrivacyToggle === 3 && <><PrivacyDisableIcon /><FriendsIcon /></>}
        </div>
      </div>
      <div className="setting-option">
        <div>
          <p>Visibility List</p>
          <span>Use Custom Visibility List</span>
        </div>
        <div
          className="setting-icons"
          onClick={() =>
            updatePrivacySetting(
              'useCustomVisibilityList',
              !privacySettings.useCustomVisibilityList
            )
          }
        >
          {privacySettings.useCustomVisibilityList ? (
            <CheckIcon />
          ) : (
            <UncheckIcon />
          )}
        </div>
      </div>
      {privacySettings.useCustomVisibilityList && (
        <>
          <div className="search-user">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              placeholder="Search users..."
            />
            <div className="search-results">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="search-result-item"
                  onClick={() => handleAddCustomUser(user)}
                >
                  <img
                    src={user.profilePhoto || '/default-profile.png'}
                    alt={user.username}
                    className="user-avatar"
                  />
                  <span>{user.username}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="custom-list">
            {customList.map((user) => (
              <div key={user.id} className="custom-list-item">
                <img
                  src={user.profilePhoto || '/default-profile.png'}
                  alt={user.username}
                  className="user-avatar"
                />
                <span>{user.username}</span>
                <button onClick={() => handleRemoveCustomUser(user.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Settings;