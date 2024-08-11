import React, { useState, useEffect } from 'react';
import { db, auth, getDocs } from '../firebase';
import { collection, query, where, onSnapshot, deleteDoc, updateDoc, setDoc, doc, getDoc, arrayUnion } from 'firebase/firestore';
import '../styles/quests.css';
import { useNotification } from '../NotificationContext';
import mapboxgl from 'mapbox-gl';

const Quests = ({ map, currentUserIds }) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeFrame, setTimeFrame] = useState('');
  const [quests, setQuests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [pendingQuest, setPendingQuest] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [acceptors, setAcceptors] = useState({ acceptors: [], pendingAcceptors: [] });
  const [showAcceptorsModal, setShowAcceptorsModal] = useState(false);
  const [selectedAcceptor, setSelectedAcceptor] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);

  const { showNotification } = useNotification();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersQuery = query(collection(db, 'users'));
        const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
          if (snapshot.empty) {
            console.error("No users found.");
            setUsers([]);
            return;
          }
          const fetchedUsers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setUsers(fetchedUsers);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (auth.currentUser) {
      // Fetch quests
      const fetchQuests = async () => {
        try {
          const publicQuestsQuery = query(collection(db, 'quests'), where('isPublic', '==', true));
          const createdQuestsQuery = query(collection(db, 'quests'), where('uid', '==', auth.currentUser.uid));
          const targetQuestsQuery = query(collection(db, 'quests'), where('targetUser', '==', auth.currentUser.uid));

          const [publicSnapshot, createdSnapshot, targetSnapshot] = await Promise.all([
            getDocs(publicQuestsQuery),
            getDocs(createdQuestsQuery),
            getDocs(targetQuestsQuery)
          ]);

          const publicQuests = publicSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const createdQuests = createdSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const targetQuests = await Promise.all(targetSnapshot.docs.map(async docSnap => {
            const questData = docSnap.data();
            const senderDoc = await getDoc(doc(db, 'users', questData.uid));
            const senderData = senderDoc.exists() ? senderDoc.data() : {};
            return { id: docSnap.id, ...questData, senderName: senderData.name || 'Unknown sender' };
          }));

          const allQuests = [...publicQuests, ...createdQuests, ...targetQuests];
          const uniqueQuests = new Map(allQuests.map(q => [q.id, q]));
          setQuests(Array.from(uniqueQuests.values()));

        } catch (error) {
          console.error("Error fetching quests:", error);
        }
      };

      fetchQuests();
    }
  }, [auth.currentUser, showNotification, users]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateQuest = () => {
    if (!auth.currentUser) {
      return;
    }

    const newQuest = {
      uid: auth.currentUser.uid,
      title,
      description,
      timeFrame,
      createdAt: new Date(),
      isPublic,
      targetUser: isPublic ? null : selectedUser.id,
      status: 'pending',
      acceptedBy: isPublic ? [] : null,
    };

    setPendingQuest(newQuest);
    setConfirmationDialogOpen(true);
    setIsPopupOpen(false);
  };

  const handleConfirmQuest = async () => {
    if (!auth.currentUser) {
      return;
    }

    if (!pendingQuest) {
      console.error("Pending quest is null.");
      return;
    }

    try {
      const questRef = doc(collection(db, 'quests'));
      if (pendingQuest.isPublic) {
        await setDoc(questRef, { ...pendingQuest, id: questRef.id, uid: auth.currentUser.uid, acceptedBy: [], pendingAcceptors: [] });
      } else {
        if (!pendingQuest.targetUser) {
          console.error("Target user is missing in the quest");
          return;
        }

        const existingQuestQuery = query(
          collection(db, 'quests'),
          where('uid', '==', auth.currentUser.uid),
          where('targetUser', '==', pendingQuest.targetUser),
          where('title', '==', pendingQuest.title),
          where('description', '==', pendingQuest.description),
          where('isPublic', '==', false)
        );

        const existingQuestSnapshot = await getDocs(existingQuestQuery);
        if (!existingQuestSnapshot.empty) {
          showNotification('A similar private quest already exists for this user.', 'info');
          return;
        }

        await setDoc(questRef, { ...pendingQuest, id: questRef.id, uid: auth.currentUser.uid, acceptedBy: [], pendingAcceptors: [] });
      }

      showNotification('Quest created!', 'success');
      setPendingQuest(null);
      setConfirmationDialogOpen(false);
      setTitle('');
      setDescription('');
      setTimeFrame('');
      setSelectedUser(null);
      setSearchTerm('');
      setIsPublic(false);
    } catch (error) {
      console.error('Error creating quest:', error);
      showNotification('Failed to create quest.', 'error');
    }
  };

  const handleDeclineQuest = async (questId) => {
    if (!auth.currentUser) {
      return;
    }

    try {
      const questRef = doc(db, 'quests', questId);
      const questDoc = await getDoc(questRef);
      const questData = questDoc.data();

      if (!questData.isPublic && questData.targetUser === auth.currentUser.uid) {
        // For private quests, delete the quest entirely
        await deleteDoc(questRef);
        setQuests(quests.filter(quest => quest.id !== questId));
        showNotification('Quest declined!', 'success');
      } else if (questData.isPublic) {
        // For public quests, add the current user to the declinedBy array
        await updateDoc(questRef, {
          declinedBy: arrayUnion(auth.currentUser.uid)
        });
        // Remove the quest from the local state for this user
        setQuests(quests.filter(quest => quest.id !== questId));
        showNotification('Quest declined!', 'success');
      } else {
        // For quests where the current user is not the target and it's not public
        const updatedAcceptedBy = questData.acceptedBy.filter(id => id !== auth.currentUser.uid);
        await updateDoc(questRef, { acceptedBy: updatedAcceptedBy });
        setQuests(quests.map(q => q.id === questId ? { ...q, acceptedBy: updatedAcceptedBy } : q));
        showNotification('Quest declined!', 'success');
      }
    } catch (error) {
      console.error('Error declining quest:', error);
      showNotification('Failed to decline quest.', 'error');
    }
  };

  const handleAcceptQuest = async (quest) => {
    if (!auth.currentUser) {
      console.error('No authenticated user');
      return;
    }
  
    console.log('Quest object:', quest);  // Log the entire quest object
  
    if (!quest.id) {
      console.error('Quest ID is missing');
      return;
    }
  
    const updatedQuest = {
      ...quest,
      status: 'accepted',
    };
  
    if (quest.isPublic) {
      updatedQuest.pendingAcceptors = [...(quest.pendingAcceptors || []), auth.currentUser.uid];
    } else {
      updatedQuest.acceptedBy = auth.currentUser.uid;
    }
  
    try {
      const questRef = doc(db, 'quests', quest.id);
      await updateDoc(questRef, updatedQuest);
      setQuests(prevQuests => prevQuests.map(q => q.id === quest.id ? updatedQuest : q));
      showNotification('Quest accepted!', 'success');
  
      if (!quest.uid) {
        console.error('Sender ID is missing from the quest object');
        return;
      }
  
      // Fetch the sender's location from the database
      const senderRef = doc(db, 'users', quest.uid);
      const senderDoc = await getDoc(senderRef);
      
      if (!senderDoc.exists()) {
        console.error('Sender document not found');
        return;
      }
  
      const senderData = senderDoc.data();
      console.log('Sender data:', senderData);
  
      if (!senderData || !senderData.location) {
        console.error('Sender location not found');
        return;
      }
  
      const senderLocation = senderData.location;
      console.log('Sender location:', senderLocation);
  
      if (!map) {
        console.error('Map object is not available');
        return;
      }
  
      // Get the current user's location
      const userLocation = map.getCenter();
      console.log('User location:', userLocation);
  
      // Calculate and display the route
      const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${senderLocation.longitude},${senderLocation.latitude};${userLocation.lng},${userLocation.lat}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
  
      console.log('Fetching route from URL:', url);
  
      const response = await fetch(url);
      const data = await response.json();
  
      console.log('Route data:', data);
  
      if (!data.routes || data.routes.length === 0) {
        console.error('No route found in the response');
        return;
      }
  
      const route = data.routes[0].geometry;
  
      if (map.getSource('route')) {
        map.getSource('route').setData(route);
      } else {
        map.addLayer({
          id: 'route',
          type: 'line',
          source: {
            type: 'geojson',
            data: route
          },
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#007bff',
            'line-width': 5,
            'line-opacity': 0.75
          }
        });
      }
  
      // Add a marker at the sender's location
      if (map.getSource('sender')) {
        map.getSource('sender').setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [senderLocation.longitude, senderLocation.latitude]
          }
        });
      } else {
        map.addLayer({
          id: 'sender',
          type: 'circle',
          source: {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: [senderLocation.longitude, senderLocation.latitude]
              }
            }
          },
          paint: {
            'circle-radius': 10,
            'circle-color': '#3887be'
          }
        });
      }
  
      // Fit the map bounds to include both the sender's location and the current user's location
      const bounds = new mapboxgl.LngLatBounds()
        .extend([senderLocation.longitude, senderLocation.latitude])
        .extend([userLocation.lng, userLocation.lat]);
      map.fitBounds(bounds, { padding: 50 });
  
    } catch (error) {
      console.error('Error accepting quest:', error);
      showNotification('Failed to accept quest.', 'error');
    }
  };
  

  const handleApproveAcceptor = async (questId) => {
    console.log('Approving acceptor:', selectedAcceptor);

    if (!selectedAcceptor) {
      console.error('Selected acceptor is not defined.');
      return;
    }

    try {
      const questRef = doc(db, 'quests', questId);
      const questDoc = await getDoc(questRef);
      const questData = questDoc.data();

      if (!questData) {
        throw new Error('Quest data is missing.');
      }

      // Filter out the selectedAcceptor from pendingAcceptors and add it to acceptedBy
      const newPendingAcceptors = questData.pendingAcceptors ? questData.pendingAcceptors.filter(id => id !== selectedAcceptor.id) : [];
      const newAcceptedBy = questData.acceptedBy ? [...questData.acceptedBy, selectedAcceptor.id] : [selectedAcceptor.id];

      // Update the quest document
      await updateDoc(questRef, {
        pendingAcceptors: newPendingAcceptors,
        acceptedBy: newAcceptedBy,
        targetUser: selectedAcceptor.id // Set the target user
      });

      setQuests(prevQuests => prevQuests.map(q =>
        q.id === questId ? { ...q, pendingAcceptors: newPendingAcceptors, acceptedBy: newAcceptedBy, targetUser: selectedAcceptor.id } : q
      ));

      showNotification(`Quest approved for ${selectedAcceptor.name}!`, 'success');
      setShowApproveModal(false);
    } catch (error) {
      console.error('Error approving acceptor:', error);
      showNotification('Failed to approve acceptor.', 'error');
    }
  };

  const handleCompleteQuest = async (questId) => {
    try {
      const questRef = doc(db, 'quests', questId);
      await deleteDoc(questRef);
      setQuests(quests.filter(quest => quest.id !== questId));
      showNotification('Quest completed and deleted!', 'success');
    } catch (error) {
      console.error('Error completing quest:', error);
      showNotification('Failed to complete quest.', 'error');
    }
  };

  const handleCancelQuest = async (questId) => {
    try {
      const questRef = doc(db, 'quests', questId);
      await deleteDoc(questRef);
      setQuests(quests.filter(quest => quest.id !== questId));
      showNotification('Quest canceled!', 'success');
    } catch (error) {
      console.error('Error canceling quest:', error);
      showNotification('Failed to cancel quest.', 'error');
    }
  };

  const handleViewAcceptors = async (quest) => {
    try {
      const questRef = doc(db, 'quests', quest.id);
      const questDoc = await getDoc(questRef);
      const questData = questDoc.data();

      const acceptorsIds = questData.acceptedBy || [];
      const pendingAcceptorsIds = questData.pendingAcceptors || [];

      const acceptors = await Promise.all(acceptorsIds.map(async (id) => {
        const userDoc = await getDoc(doc(db, 'users', id));
        return userDoc.data();
      }));

      const pendingAcceptors = await Promise.all(pendingAcceptorsIds.map(async (id) => {
        const userDoc = await getDoc(doc(db, 'users', id));
        return userDoc.data();
      }));

      setAcceptors({ acceptors, pendingAcceptors });
      setSelectedQuest(quest);
      setShowAcceptorsModal(true);
    } catch (error) {
      console.error('Error fetching acceptors:', error);
    }
  };

  const handleProfileClick = async (profile) => {
    setSelectedProfile(profile);
    setSelectedUser(profile);
    setSearchTerm('');
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredQuests = quests.filter(quest => {
    if (quest.isPublic) {
      return quest.uid === auth.currentUser.receiverId || quest.approvedUser === auth.currentUser.receiverId;
    } else {
      return quest.targetUser === auth.currentUser.receiverId || quest.uid === auth.currentUser.receiverId;
    }
  });

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchTerm('');
  };

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  const handleToggleChange = () => {
    setIsPublic(!isPublic);
  };

  const handleDescriptionChange = (e) => {
    const words = e.target.value.split(/\s+/);
    if (words.length <= 300) {
      setDescription(e.target.value);
    }
  };

  const handleSelectAcceptor = async (quest, user) => {
    try {
      const questRef = doc(db, 'quests', quest.id);
      await updateDoc(questRef, { acceptedBy: user.id, pendingAcceptors: [] });
      setQuests(quests.map(q => q.id === quest.id ? { ...q, acceptedBy: user.id, pendingAcceptors: [] } : q));
      setAcceptors([]);
      showNotification(`Quest assigned to ${user.name}!`, 'success');
    } catch (error) {
      console.error('Error selecting acceptor:', error);
      showNotification('Failed to assign quest.', 'error');
    }
  };

  const handleFriendUser = async (user) => {
    if (!auth.currentUser) {
      return;
    }

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();
      const friends = userData.friends || [];
      if (!friends.includes(user.id)) {
        await updateDoc(userRef, { friends: [...friends, user.id] });
        showNotification(`${user.name} added as a friend!`, 'success');
      } else {
        showNotification(`${user.name} is already your friend.`, 'info');
      }
    } catch (error) {
      console.error('Error adding friend:', error);
      showNotification('Failed to add friend.', 'error');
    }
  };

  const closeProfilePopup = () => {
    setSelectedProfile(null);
  };

  return (
    <div className="quests-page">
      <div className="quests-header">
        <h2>Quests</h2>
        <button onClick={togglePopup}>+</button>
      </div>

      {isPopupOpen && (
        <div className="modal-overlay">
          <div className="modal quest-popup">
            <h3>Create a New Quest</h3>
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              placeholder="Description"
              value={description}
              onChange={handleDescriptionChange}
            />
            <select
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value)}
            >
              <option value="">Select Time Frame</option>
              <option value="5 mins">5 mins</option>
              <option value="10 mins">10 mins</option>
              <option value="15 mins">15 mins</option>
              <option value="30 mins">30 mins</option>
              <option value="1 hour">1 hour</option>
            </select>
            <div className="toggle-container">
              <label className="switch">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={handleToggleChange}
                />
                <span className="slider"></span>
              </label>
              <span>{isPublic ? 'Public' : 'Private'}</span>
            </div>
            {!isPublic && (
              <>
                <input
                  type="text"
                  placeholder="Search user"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {searchTerm && filteredUsers.length > 0 && (
                  <div className="user-search-results">
                    {filteredUsers.map(user => (
                      <div
                        key={user.id}
                        className="user-search-result"
                        onClick={() => handleSelectUser(user)}
                      >
                        <img src={user.profilePhoto || '/default-profile.png'} alt="Profile" className="user-pfp" />
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
              </>
            )}
            <div className="modal-actions">
              <button className="confirm-button" onClick={handleCreateQuest}>Prepare Quest</button>
              <button className="cancel-button" onClick={() => setIsPopupOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {confirmationDialogOpen && pendingQuest && (
        <div className="modal-overlay">
          <div className="modal confirmation-dialog">
            <h3>Confirm Quest Sending</h3>
            <p>Are you sure you want to send the quest with the following details?</p>
            <p><strong>Title:</strong> {pendingQuest.title}</p>
            <p><strong>Description:</strong> {pendingQuest.description}</p>
            <p><strong>Time Frame:</strong> {pendingQuest.timeFrame}</p>
            <div className="modal-actions">
              <button className="confirm-button" onClick={handleConfirmQuest}>Confirm</button>
              <button className="cancel-button" onClick={() => setConfirmationDialogOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {selectedProfile && (
        <div className="modal-overlay">
          <div className="modal profile-popup">
            <button className="close-button" onClick={closeProfilePopup}>X</button>
            <h3>{selectedProfile.name}</h3>
            <img src={selectedProfile.profilePhotoUrl || '/default-profile.png'} alt="Profile" className="profile-pic" />
            <p><strong>Bio:</strong> {selectedProfile.bio}</p>
          </div>
        </div>
      )}

      {showApproveModal && selectedAcceptor && (
        <div className="modal-overlay">
          <div className="modal approve-modal">
            <h3>Approve Acceptor</h3>
            <p>Are you sure you want to approve {selectedAcceptor.name} for this quest?</p>
            <div className="modal-actions">
              <button className="confirm-button" onClick={() => handleApproveAcceptor(selectedQuest.id)}>Approve</button>
              <button className="cancel-button" onClick={() => setShowApproveModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showAcceptorsModal && (
        <div className="modal-overlay">
          <div className="modal acceptors-modal">
            <h3>Accepted By</h3>
            <ul>
              {acceptors.acceptors.map((user, index) => (
                <li key={index}>{user.name}</li>
              ))}
            </ul>
            <h3>Pending Acceptors</h3>
            <ul>
              {acceptors.pendingAcceptors.map((user, index) => (
                <li key={index}>
                  {user.name}
                  <button className="select-button" onClick={() => {
                    setSelectedAcceptor(user);
                    setShowApproveModal(true);
                  }}>Select</button>
                </li>
              ))}
            </ul>
            <button className="close-button" onClick={() => setShowAcceptorsModal(false)}>Close</button>
          </div>
        </div>
      )}

      <div className="quests-list">
        <div className="quests-column">
          <h3>Public Quests</h3>
          {filteredQuests.filter(quest => quest.isPublic && (!quest.declinedBy || !quest.declinedBy.includes(auth.currentUser.uid))).length > 0 ? (
            filteredQuests.filter(quest => quest.isPublic && (!quest.declinedBy || !quest.declinedBy.includes(auth.currentUser.uid))).map((quest) => {
              const sender = users.find(user => user.id === quest.uid) || {};
              const senderName = sender.name || '';

              return (
                <div key={quest.id} className="quest-item">
                  <p><strong>Title:</strong> {quest.title}</p>
                  <p><strong>Description:</strong> {quest.description}</p>
                  <p><strong>Time Frame:</strong> {quest.timeFrame}</p>
                  <p><strong>Sender:</strong> {senderName}</p>

                  {quest.isPublic && auth.currentUser.uid !== quest.uid && !quest.acceptedBy.includes(auth.currentUser.uid) && !quest.pendingAcceptors.includes(auth.currentUser.uid) && (
                    <div className="quest-actions">
                      <button className="confirm-button" onClick={() => handleAcceptQuest(quest)}>Accept</button>
                      <button className="cancel-button" onClick={() => handleDeclineQuest(quest.id)}>Decline</button>
                    </div>
                  )}

                  {quest.uid === auth.currentUser.uid && (
                    <div className="quest-actions">
                      <button className="select-button" onClick={() => handleViewAcceptors(quest)}>View Pending Acceptors</button>
                      <button className="cancel-button" onClick={() => handleCancelQuest(quest.id)}>Cancel Quest</button>
                    </div>
                  )}

                  {quest.acceptedBy.includes(auth.currentUser.uid) && (
                    <div className="quest-actions">
                      <button className="confirm-button" onClick={() => handleCompleteQuest(quest.id)}>Complete</button>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p>No public quests.</p>
          )}
        </div>

        <div className="quests-column">
          <h3>Received Quests</h3>
          {quests.filter(quest => quest.targetUser === auth.currentUser.uid && !quest.isPublic).length > 0 ? (
            quests.filter(quest => quest.targetUser === auth.currentUser.uid && !quest.isPublic).map((quest) => {
              const sender = users.find(user => user.id === quest.uid) || {};
              const senderName = sender.name || '';
              const isRecipient = quest.targetUser === auth.currentUser.uid;
              const isSender = quest.uid === auth.currentUser.uid;

              return (
                <div key={quest.id} className="quest-item">
                  <p><strong>Title:</strong> {quest.title}</p>
                  <p><strong>Description:</strong> {quest.description}</p>
                  <p><strong>Time Frame:</strong> {quest.timeFrame}</p>
                  <p><strong>Sender:</strong> {senderName}</p>
                  {isRecipient && quest.status === 'accepted' && (
                    <div className="quest-actions">
                      <button className="confirm-button" onClick={() => handleCompleteQuest(quest.id)}>Complete</button>
                      <button className="cancel-button" onClick={() => handleCancelQuest(quest.id)}>Cancel</button>
                    </div>
                  )}
                  {isRecipient && quest.status !== 'accepted' ? (
                    <div className="quest-actions">
                      <button className="confirm-button" onClick={() => handleAcceptQuest(quest)}>Accept</button>
                      <button className="cancel-button" onClick={() => handleDeclineQuest(quest.id)}>Decline</button>
                    </div>
                  ) : isSender ? (
                    <p>Status: {quest.status}</p>
                  ) : null}
                  {quest.acceptedBy && (
                    <div>
                      <p><strong>Accepted By:</strong> {users.find(user => user.id === quest.acceptedBy)?.name || 'Pending acceptance'}</p>
                      <img src={users.find(user => user.id === quest.acceptedBy)?.profilePhotoUrl || '/default-profile.png'} alt="Profile" className="user-pfp" />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p>No received quests.</p>
          )}
        </div>

        <div className="quests-column">
          <h3>Sent Quests</h3>
          {quests.filter(quest => quest.uid === auth.currentUser.uid && !quest.isPublic).length > 0 ? (
            quests.filter(quest => quest.uid === auth.currentUser.uid && !quest.isPublic).map((quest) => {
              const acceptor = users.find(user => user.id === quest.acceptedBy) || {};
              const acceptorName = acceptor.name || '';
              const pendingAcceptors = users.filter(user => quest.pendingAcceptors && quest.pendingAcceptors.includes(user.id));

              return (
                <div key={quest.id} className="quest-item">
                  <p><strong>Title:</strong> {quest.title}</p>
                  <p><strong>Description:</strong> {quest.description}</p>
                  <p><strong>Time Frame:</strong> {quest.timeFrame}</p>
                  <p><strong>Status:</strong> {quest.status}</p>
                  {pendingAcceptors.length > 0 && (
                    <div>
                      <p><strong>Pending Acceptors:</strong></p>
                      <ul>
                        {pendingAcceptors.map(user => (
                          <li key={user.id} onClick={() => handleSelectAcceptor(quest, user)}>
                            {user.name}
                            <img src={user.profilePhotoUrl || '/default-profile.png'} alt="Profile" className="user-pfp" />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {quest.acceptedBy && (
                    <div>
                      <p><strong>Accepted By:</strong> {acceptorName}</p>
                      <img src={acceptor.profilePhotoUrl || '/default-profile.png'} alt="Profile" className="user-pfp" />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p>No sent quests.</p>
          )}
        </div>
      </div>
    </div>
  );
}
  
export default Quests;