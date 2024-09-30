import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNotification } from '../NotificationContext';
import '../styles/CreateQuestModal.css';

const CreateQuestModal = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeFrame, setTimeFrame] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  const { showNotification } = useNotification();

  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers([]);
    }
  }, [searchTerm, users]);

  const handleCreateQuest = async () => {
    if (!auth.currentUser) {
      showNotification('You must be logged in to create a quest.', 'error');
      return;
    }

    if (!title || !description || !timeFrame) {
      showNotification('Please fill in all fields.', 'error');
      return;
    }

    if (!isPublic && !selectedUser) {
      showNotification('Please select a user for private quest.', 'error');
      return;
    }

    try {
      const newQuest = {
        uid: auth.currentUser.uid,
        title,
        description,
        timeFrame,
        createdAt: serverTimestamp(),
        isPublic,
        targetUser: isPublic ? null : selectedUser.id,
        status: 'pending',
        acceptedBy: isPublic ? [] : null,
      };

      await addDoc(collection(db, 'quests'), newQuest);
      showNotification('Quest created successfully!', 'success');
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error creating quest:', error);
      showNotification('Failed to create quest.', 'error');
    }
  };

  const handleToggleChange = () => {
    setIsPublic(!isPublic);
    setSelectedUser(null);
    setSearchTerm('');
  };

  const handleDescriptionChange = (e) => {
    const words = e.target.value.split(/\s+/);
    if (words.length <= 300) {
      setDescription(e.target.value);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchTerm('');
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTimeFrame('');
    setIsPublic(false);
    setSearchTerm('');
    setSelectedUser(null);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="quest-popup">
        <div className="modal-content">
          <div className="modal-header">
            <svg onClick={onClose} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
            <h2>Create a New Quest</h2>
          </div>

          <div className="input-group">
            <label htmlFor="quest-title">Title</label>
            <input
              id="quest-title"
              type="text"
              placeholder="Enter quest title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="profile-input"
            />
          </div>

          <div className="input-group">
            <label htmlFor="quest-description">Description</label>
            <textarea
              id="quest-description"
              placeholder="Enter quest description"
              value={description}
              onChange={handleDescriptionChange}
              className="profile-bio-edit"
            />
          </div>

          <div className="input-group">
            <label htmlFor="quest-timeframe">Time Frame</label>
            <select
              id="quest-timeframe"
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value)}
              className="profile-input"
            >
              <option value="">Select Time Frame</option>
              <option value="5 mins">5 mins</option>
              <option value="10 mins">10 mins</option>
              <option value="15 mins">15 mins</option>
              <option value="30 mins">30 mins</option>
              <option value="1 hour">1 hour</option>
            </select>
          </div>

          <div className="toggle-container">
            <p>Public Quest</p>
            <label className="switch">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={handleToggleChange}
              />
              <span className="slider"></span>
            </label>
          </div>

          {!isPublic && (
            <div className="user-search-container">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="user-search-input"
              />
              {searchTerm && filteredUsers.length > 0 && (
                <div className="user-search-results">
                  {filteredUsers.map(user => (
                    <div
                      key={user.id}
                      className="user-search-result"
                      onClick={() => handleSelectUser(user)}
                    >
                      <img src={user.profilePhotoUrl || '/default-profile.png'} alt="Profile" className="user-pfp" />
                      {user.name}
                    </div>
                  ))}
                </div>
              )}
              {selectedUser && (
                <div className="selected-user">
                  <p>Selected User: {selectedUser.name}</p>
                </div>
              )}
            </div>
          )}

          <div className="modal-actions">
            <button className="cancel-button" onClick={onClose}>Cancel</button>
            <button className="create-quest-button" onClick={handleCreateQuest}>Create Quest</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateQuestModal;