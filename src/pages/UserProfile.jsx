import React, { useState, useRef, useEffect } from 'react';
import {
  auth,
  uploadImage,
  updateUserProfile,
  fetchUserData,
  db,
} from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../NotificationContext';
import { useUserStatus } from '../components/UserStatusContext';
import { Privacy } from '../components/Privacy';
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { useSpring, animated } from 'react-spring';
import { useDrag } from 'react-use-gesture';
import '../styles/profile.css';
import './UserProfile.css';
import NavigationModalWrapper from '../components/navigation-modal/NavigationModalWrapper';

import SettingIcon from '../assets/icons/settings_24dp_E8EAED_FILL0_wght700_GRAD0_opsz24.svg?react';
import EditIcon from '../assets/icons/edit_24dp_E8EAED_FILL0_wght700_GRAD0_opsz24.svg?react';
import SaveIcon from '../assets/icons/check_24dp_E8EAED_FILL0_wght500_GRAD0_opsz24.svg?react';

const UserProfile = ({ handleLogout, isNavExpanded }) => {
  const [profilePhoto, setProfilePhoto] = useState('placeholder.jpg');
  const [name, setName] = useState('Default Name');
  const [username, setUsername] = useState('default_username');
  const [bio, setBio] = useState('Default Bio');
  const [isEditing, setIsEditing] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [tags, setTags] = useState([]);
  const [showTagOptions, setShowTagOptions] = useState(false);
  const [recentQuests, setRecentQuests] = useState([]);
  const [activeQuest, setActiveQuest] = useState(null);
  const fileInputRef = useRef(null);
  const { showNotification } = useNotification();
  const { userStatus } = useUserStatus();
  const navigate = useNavigate();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [containerHeight, setContainerHeight] = useState(
    window.innerHeight * 0.5
  );

  const predefinedTags = [
    { img: '/education.png', value: 'education' },
    { img: '/food.png', value: 'food' },
    { img: '/games.png', value: 'games' },
    { img: '/other.png', value: 'other' },
  ];

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (auth.currentUser) {
      fetchUserDataAndUpdate();
      fetchRecentQuests();
      fetchActiveQuest();
    }
  }, []);

  const fetchUserDataAndUpdate = async () => {
    try {
      const userData = await fetchUserData(auth.currentUser.uid);
      if (userData) {
        setName(userData.name || 'Default Name');
        setUsername(userData.username || 'default_username');
        setProfilePhoto(userData.profilePhoto || 'placeholder.jpg');
        setBio(userData.bio || 'Default Bio');
        setIsPrivate(userData.isPrivate || false);
        setTags(userData.tags || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      showNotification('Failed to load user data', 'error');
    }
  };

  const fetchRecentQuests = async () => {
    if (!auth.currentUser) return;

    try {
      const questsQuery = query(
        collection(db, 'quests'),
        where('uid', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const questsSnapshot = await getDocs(questsQuery);
      const quests = questsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecentQuests(quests);
    } catch (error) {
      console.error('Error fetching recent quests:', error);
      showNotification('Failed to load recent quests', 'error');
    }
  };

  const fetchActiveQuest = async () => {
    if (!auth.currentUser) return;

    try {
      const activeQuestQuery = query(
        collection(db, 'quests'),
        where('uid', '==', auth.currentUser.uid),
        where('status', '==', 'accepted')
      );
      const activeQuestSnapshot = await getDocs(activeQuestQuery);
      if (!activeQuestSnapshot.empty) {
        const activeQuestData = activeQuestSnapshot.docs[0].data();
        if (activeQuestData.targetUser) {
          const partnerUserData = await fetchUserData(
            activeQuestData.targetUser
          );
          setActiveQuest({
            ...activeQuestData,
            partnerName: partnerUserData?.name || 'Unknown',
            partnerPhoto: partnerUserData?.profilePhoto || 'placeholder.jpg',
            partnerUsername: partnerUserData?.username || 'unknown_user',
          });
        } else {
          setActiveQuest(activeQuestData);
        }
      } else {
        setActiveQuest(null);
      }
    } catch (error) {
      console.error('Error fetching active quest:', error);
      showNotification('Failed to load active quest', 'error');
    }
  };

  const handlePrivacyModeChange = async (newPrivacyMode) => {
    setIsPrivate(newPrivacyMode);
    try {
      await updateUserProfile(auth.currentUser.uid, {
        isPrivate: newPrivacyMode,
      });
      showNotification('Privacy settings updated', 'success');
    } catch (error) {
      console.error('Error updating privacy mode:', error);
      showNotification('Failed to update privacy settings', 'error');
    }
  };

  const handleEditProfile = () => {
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    try {
      let photoURL = profilePhoto;
      if (selectedPhoto) {
        photoURL = await uploadImage(selectedPhoto);
      }

      await updateUserProfile(auth.currentUser.uid, {
        name,
        username,
        bio,
        profilePhoto: photoURL,
        tags,
      });
      setIsEditing(false);
      setSelectedPhoto(null);
      showNotification('Profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showNotification('Failed to update profile', 'error');
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedPhoto(file);
      setProfilePhoto(URL.createObjectURL(file));
    }
  };

  const handleProfilePhotoClick = () => {
    if (isEditing) {
      fileInputRef.current.click();
    }
  };

  const handleAddTag = async (tag) => {
    if (tags.length < 3 && !tags.includes(tag)) {
      const updatedTags = [...tags, tag];
      setTags(updatedTags);
      try {
        await updateUserProfile(auth.currentUser.uid, { tags: updatedTags });
        showNotification('Tag added successfully', 'success');
      } catch (error) {
        console.error('Error adding tag:', error);
        showNotification('Failed to add tag', 'error');
      }
    }
  };

  const handleRemoveTag = async (tag) => {
    const updatedTags = tags.filter((t) => t !== tag);
    setTags(updatedTags);
    try {
      await updateUserProfile(auth.currentUser.uid, { tags: updatedTags });
      showNotification('Tag removed successfully', 'success');
    } catch (error) {
      console.error('Error removing tag:', error);
      showNotification('Failed to remove tag', 'error');
    }
  };

  const toggleTagOptions = () => {
    setShowTagOptions(!showTagOptions);
  };

  const getStatusColor = () => {
    switch (userStatus) {
      case 'online':
        return 'green';
      case 'idle':
        return 'yellow';
      case 'on quest':
        return 'red';
      case 'offline':
      default:
        return 'grey';
    }
  };

  const bindDrag = useDrag(
    ({ movement: [, my], down, event }) => {
      if (isMobile) {
        if (down) {
          const newHeight = window.innerHeight * 0.5 - my;
          setContainerHeight(
            Math.max(100, Math.min(newHeight, window.innerHeight - 60))
          );
        }
        event.preventDefault();
      }
    },
    {
      delay: 0,
      threshold: 5,
    }
  );

  const springProps = useSpring({
    height: isMobile ? containerHeight : 'auto',
    config: { tension: 300, friction: 30 },
  });

  if (true)
    return (
      <NavigationModalWrapper>
        <div className="prof-container">
          <header>
            <div className="prof">
              <div
                className="prof-picture"
                onClick={() => isEditing && handleProfilePhotoClick()}
                style={isEditing ? { cursor: 'pointer' } : {}}
              >
                {isEditing && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoChange}
                      style={{ display: 'none' }}
                    />
                    <EditIcon />
                  </>
                )}
                <img src={profilePhoto} alt="ProfilePicture" />
              </div>
              <div
                className="prof-name-container"
                style={isEditing ? { gap: '4px' } : {}}
              >
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="prof-input"
                      placeholder="Name"
                    />
                    <div>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="prof-input"
                        placeholder="Username"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="prof-name">{name}</p>
                    <p className="prof-username">@{username}</p>
                  </>
                )}
              </div>
              <div className="prof-header-buttons">
                {isEditing ? (
                  <SaveIcon onClick={handleSaveProfile} />
                ) : (
                  <EditIcon onClick={() => setIsEditing(true)} />
                )}
                <SettingIcon onClick={() => navigate('/home/settings')} />
              </div>
            </div>
            <div className="prof-bio">
              <h3>Bio</h3>
              {isEditing ? (
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="prof-bio-edit"
                  placeholder="Bio"
                  maxLength={150}
                />
              ) : (
                <p>{bio}</p>
              )}
            </div>
          </header>

          <div className="prof-body">
            <div className="profile-section">
              <h3 className="section-title">Tags</h3>
              <div className="tags-container">
                {tags.map((tag) => (
                  <div key={tag} className="tag">
                    <img
                      src={
                        predefinedTags.find((t) => t.value === tag)?.img ||
                        '/other.png'
                      }
                      alt={tag}
                      className="tag-icon"
                    />
                    <button onClick={() => handleRemoveTag(tag)}>x</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="profile-section">
              <h3 className="section-title">Active Quests</h3>
              {activeQuest ? (
                <div className="quest-item">
                  <p>"{activeQuest.title}" with</p>
                  {activeQuest.partnerName && (
                    <div className="quest-partner">
                      <img
                        src={activeQuest.partnerPhoto || 'placeholder.jpg'}
                        alt={activeQuest.partnerName}
                        className="partner-photo"
                      />
                      <p>
                        {activeQuest.partnerName} @{activeQuest.partnerUsername}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="section-empty-msg">
                  No quests ongoing. Ready to start a new adventure?
                </p>
              )}
            </div>

            <div className="profile-section">
              <h3 className="section-title">Recent Quests</h3>
              {recentQuests.length > 0 ? (
                recentQuests.map((quest) => (
                  <div key={quest.id} className="quest-item">
                    <p>{quest.title}</p>
                    {quest.targetUser && (
                      <p>
                        with{' '}
                        {typeof quest.targetUser === 'string'
                          ? quest.targetUser
                          : quest.targetUser.name || 'Unknown User'}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="section-empty-msg">
                  No recent quests. Time to explore!
                </p>
              )}
            </div>
          </div>
        </div>
      </NavigationModalWrapper>
    );

  return (
    <NavigationModalWrapper>
      <div
        className={`profile-container ${isMobile ? 'mobile' : 'desktop'} ${
          isNavExpanded ? 'nav-expanded' : ''
        }`}
        style={isMobile ? springProps : {}}
      >
        {isMobile && <div className="drag-handle" {...bindDrag()} />}
        <div className="profile-content">
          <div className="profile-header">
            <div
              className="profile-photo-container"
              onClick={handleProfilePhotoClick}
            >
              <img src={profilePhoto} alt="Profile" className="profile-photo" />
              {isEditing && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    style={{ display: 'none' }}
                  />
                  <div className="edit-photo-overlay">Edit Profile Photo</div>
                </>
              )}
            </div>
            <div className="profile-name-status">
              <h2 className="profile-name">{name}</h2>
              <p className="profile-username">@{username}</p>
              <p className="profile-status">
                <span className={`status-dot ${getStatusColor()}`}></span>
                {userStatus.charAt(0).toUpperCase() + userStatus.slice(1)}
              </p>
            </div>
            <div className="privacy-icon">
              <Privacy
                isPrivate={isPrivate}
                onPrivacyChange={handlePrivacyModeChange}
              />
            </div>
          </div>

          {isEditing ? (
            <div className="profile-section">
              <h3 className="section-title">Edit Profile</h3>
              <div className="nameedit">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="profile-input"
                  placeholder="Name"
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="profile-input"
                  placeholder="Username"
                />
              </div>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="profile-bio-edit"
                placeholder="Bio"
                maxLength={150}
              />
            </div>
          ) : (
            <div className="profile-section">
              <h3 className="section-title">Bio</h3>
              <p className="profile-bio">{bio}</p>
            </div>
          )}

          <div className="profile-actions">
            <button
              className="edit-profile-button"
              onClick={isEditing ? handleSaveProfile : handleEditProfile}
            >
              <i className="fas fa-user-edit"></i>{' '}
              {isEditing ? 'Save Profile' : 'Edit Profile'}
            </button>
            <div className="add-tag">
              <button className="add-tag-btn" onClick={toggleTagOptions}>
                Add Tags
              </button>
              {showTagOptions && (
                <div className="tag-options">
                  {predefinedTags.map(({ img, value }) => (
                    <button key={value} onClick={() => handleAddTag(value)}>
                      <img src={img} alt={value} className="tag-icon" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button className="logout-button" onClick={handleLogout}>
            <img src="/logout.png" alt="Logout" />
            <p className="logouttext">Logout</p>
          </button>
        </div>
      </div>
    </NavigationModalWrapper>
  );
};

export default UserProfile;
