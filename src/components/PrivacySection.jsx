import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import '../styles/privacy.css';
import { useSpring, animated } from 'react-spring';
import { useDrag } from 'react-use-gesture';

const PrivacySection = () => {
  const [privacySettings, setPrivacySettings] = useState({
    friendsCanSeeLocation: true,
    quietMap: false,
    canSeeOtherMarkers: true,
    useCustomVisibilityList: false,
  });
  const [customList, setCustomList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // New state for managing the container height
  const [containerHeight, setContainerHeight] = useState(window.innerHeight * 0.5);

  useEffect(() => {
    fetchPrivacySettings();
  }, []);

  const fetchPrivacySettings = async () => {
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();
      setPrivacySettings(userData.privacySettings || {
        friendsCanSeeLocation: true,
        quietMap: false,
        canSeeOtherMarkers: true,
        useCustomVisibilityList: false,
      });
      setCustomList(userData.customVisibilityList || []);
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
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
        const q = query(usersRef, where('username', '>=', e.target.value), where('username', '<=', e.target.value + '\uf8ff'));
        const querySnapshot = await getDocs(q);
        const results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching users:', error);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleAddCustomUser = async (user) => {
    if (user && !customList.some(u => u.id === user.id)) {
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
    const newList = customList.filter(u => u.id !== userId);
    setCustomList(newList);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        customVisibilityList: newList,
      });
    } catch (error) {
      console.error('Error updating custom list:', error);
    }
  };

  // Draggable functionality
  const bindDrag = useDrag(({ movement: [, my], down }) => {
    if (down) {
      const newHeight = window.innerHeight * 0.5 - my;
      setContainerHeight(Math.max(100, Math.min(newHeight, window.innerHeight - 60)));
    }
  });

  const springProps = useSpring({
    height: containerHeight,
    config: { tension: 300, friction: 30 }
  });

  return (
    <animated.div className="privacy-container" style={springProps}>
      <div className="drag-handle" {...bindDrag()} />
      <h2>Privacy Settings</h2>

      <div className="privacy-section">
        <h3 className="section-title1">Location Visibility</h3>
        <div className="privacy-option">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={privacySettings.friendsCanSeeLocation}
              onChange={(e) => updatePrivacySetting('friendsCanSeeLocation', e.target.checked)}
            />
            <span className="slider round"></span>
          </label>
          <span>Friends can see my location in privacy mode</span>
        </div>
        <div className="privacy-option">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={privacySettings.quietMap}
              onChange={(e) => updatePrivacySetting('quietMap', e.target.checked)}
            />
            <span className="slider round"></span>
          </label>
          <span>Quiet Map (Hide my location from everyone)</span>
        </div>
        <div className="privacy-option">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={privacySettings.canSeeOtherMarkers}
              onChange={(e) => updatePrivacySetting('canSeeOtherMarkers', e.target.checked)}
            />
            <span className="slider round"></span>
          </label>
          <span>See other users' markers on the map</span>
        </div>
      </div>

      <div className="privacy-section">
        <h3 className="section-title1">Custom Visibility List</h3>
        <div className="privacy-option">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={privacySettings.useCustomVisibilityList}
              onChange={(e) => updatePrivacySetting('useCustomVisibilityList', e.target.checked)}
            />
            <span className="slider round"></span>
          </label>
          <span>Use Custom Visibility List</span>
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
                {searchResults.map(user => (
                  <div key={user.id} className="search-result-item" onClick={() => handleAddCustomUser(user)}>
                    <img src={user.profilePhoto || '/default-profile.png'} alt={user.username} className="user-avatar" />
                    <span>{user.username}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="custom-list">
              {customList.map((user) => (
                <div key={user.id} className="custom-list-item">
                  <img src={user.profilePhoto || '/default-profile.png'} alt={user.username} className="user-avatar" />
                  <span>{user.username}</span>
                  <button onClick={() => handleRemoveCustomUser(user.id)}>Remove</button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </animated.div>
  );
};

export default PrivacySection;