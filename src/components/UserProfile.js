import React, { useState, useRef, useEffect } from 'react';
import { auth, uploadImage, updateUserProfile, fetchUserData, db } from '../firebase';
import { useNotification } from '../NotificationContext';
import { Privacy } from './Privacy';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import '../styles/profile.css';

const UserProfile = () => {
  const [profilePhoto, setProfilePhoto] = useState('placeholder.jpg');
  const [name, setName] = useState('Default Name');
  const [bio, setBio] = useState('Default Bio');
  const [status, setStatus] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [tags, setTags] = useState([]);
  const [showTagOptions, setShowTagOptions] = useState(false);
  const [recentQuests, setRecentQuests] = useState([]);
  const [activeQuest, setActiveQuest] = useState(null);
  const fileInputRef = useRef(null);
  const { showNotification } = useNotification();

  const predefinedTags = [
    { text: '🎓', value: 'education' },
    { text: '🍔', value: 'food' },
    { text: '🎮', value: 'games' },
    { text: '⚽', value: 'sports & activity' },
    { text: '🌟', value: 'other' }
  ];

  useEffect(() => {
    fetchUserDataAndUpdate();
    fetchRecentQuests();
    fetchActiveQuest();
  }, []);

  const fetchUserDataAndUpdate = async () => {
    try {
      const userData = await fetchUserData(auth.currentUser.uid);
      if (userData) {
        setName(userData.name || 'Default Name');
        setProfilePhoto(userData.profilePhoto || 'placeholder.jpg');
        setBio(userData.bio || 'Default Bio');
        setStatus(userData.status || '');
        setIsPrivate(userData.isPrivate || false);
        setTags(userData.tags || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchRecentQuests = async () => {
    try {
      const questsQuery = query(
        collection(db, 'quests'),
        where('uid', '==', auth.currentUser.uid),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const questsSnapshot = await getDocs(questsQuery);
      const quests = questsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentQuests(quests);
    } catch (error) {
      console.error('Error fetching recent quests:', error);
    }
  };

  const fetchActiveQuest = async () => {
    try {
      const activeQuestQuery = query(
        collection(db, 'quests'),
        where('uid', '==', auth.currentUser.uid),
        where('status', '==', 'accepted')
      );
      const activeQuestSnapshot = await getDocs(activeQuestQuery);
      if (!activeQuestSnapshot.empty) {
        const activeQuestData = activeQuestSnapshot.docs[0].data();
        const partnerUserData = await fetchUserData(activeQuestData.targetUser);
        setActiveQuest({
          ...activeQuestData,
          partnerName: partnerUserData.name,
          partnerPhoto: partnerUserData.profilePhoto,
          partnerUsername: partnerUserData.username
        });
      } else {
        setActiveQuest(null);
      }
    } catch (error) {
      console.error('Error fetching active quest:', error);
    }
  };

  const handlePrivacyModeChange = async (newPrivacyMode) => {
    setIsPrivate(newPrivacyMode);
    try {
      await updateUserProfile(auth.currentUser.uid, { isPrivate: newPrivacyMode });
    } catch (error) {
      console.error('Error updating privacy mode:', error);
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
      await updateUserProfile(auth.currentUser.uid, { tags: updatedTags });
    }
  };

  const handleRemoveTag = async (tag) => {
    const updatedTags = tags.filter((t) => t !== tag);
    setTags(updatedTags);
    await updateUserProfile(auth.currentUser.uid, { tags: updatedTags });
  };

  const toggleTagOptions = () => {
    setShowTagOptions(!showTagOptions);
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-photo-container" onClick={handleProfilePhotoClick}>
          <img src={profilePhoto} alt="Profile" className="profile-photo" />
          {isEditing && (
            <>
              <input type="file" ref={fileInputRef} onChange={handlePhotoChange} style={{ display: 'none' }} />
              <div className="edit-photo-overlay">Edit Profile Photo</div>
            </>
          )}
        </div>
        <div className="profile-info">
          {isEditing ? (
            <div className="edit-fields">
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="profile-name-edit" />
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="profile-bio-edit" maxLength={150} />
              <p className="char-count">{bio.length}/150</p>
            </div>
          ) : (
            <>
              <h2 className="profile-name">{name}</h2>
              <p className="profile-status"><span className="status-dot"></span> Active</p>
              <p className="profile-bio">{bio}</p>
            </>
          )}
        </div>
        <div className="privacy-icon">
          <Privacy isPrivate={isPrivate} onPrivacyChange={handlePrivacyModeChange} />
        </div>
      </div>

      <div className="profile-actions">
        <button className="edit-profile-button" onClick={isEditing ? handleSaveProfile : handleEditProfile}>
          <i className="fas fa-user-edit"></i> {isEditing ? 'Save Profile' : 'Edit Profile'}
        </button>
        <div className="add-tag">
          <button onClick={toggleTagOptions}>Add Tags</button>
          {showTagOptions && (
            <div className="tag-options">
              {predefinedTags.map(({ text, value }) => (
                <button key={value} onClick={() => handleAddTag(value)}>{text}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="tags-container">
        {tags.map((tag) => (
          <div key={tag} className="tag">
            {predefinedTags.find(t => t.value === tag).text}
            <button onClick={() => handleRemoveTag(tag)}>x</button>
          </div>
        ))}
      </div>

      <div className="active-quests">
        <h3>Active Quests</h3>
        {activeQuest ? (
          <div className="active-quest-item">
            <p>"{activeQuest.title}" with</p>
            <div className="quest-partner">
              <img src={activeQuest.partnerPhoto} alt={activeQuest.partnerName} className="partner-photo" />
              <p>{activeQuest.partnerName} @{activeQuest.partnerUsername}</p>
            </div>
          </div>
        ) : (
          <div className="no-active-quests">
            <p>No quests ongoing. Ready to start a new adventure?</p>
          </div>
        )}
      </div>

      <div className="recent-quests">
        <h3>Recent Quests</h3>
        {recentQuests.length > 0 ? (
          recentQuests.map(quest => (
            <div key={quest.id} className="recent-quest-item">
              <p>{quest.title}</p>
              <p>with {quest.targetUser}</p>
            </div>
          ))
        ) : (
          <div className="no-recent-quests">
            <p>No recent quests. Time to explore!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;