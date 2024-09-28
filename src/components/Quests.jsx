import React, { useState, useEffect, useCallback } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  doc,
  serverTimestamp,
  arrayRemove,
  getDoc,
  arrayUnion,
  query,
  where,
  orderBy,
  limit,
  setDoc,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import '../styles/quests.css';
import { centerMapOnUser } from '././map/UserLocationService';
import addFriendIcon from '../assets/addfriend.png';
import mapboxgl from 'mapbox-gl';
import { useNotification } from '../NotificationContext';
import { useSpring, animated } from 'react-spring';
import { useDrag } from 'react-use-gesture';
import NavigationModalWrapper from './navigation-modal/NavigationModalWrapper';

const removeRoute = (map) => {
  if (map.getLayer('route')) {
    map.removeLayer('route');
  }
  if (map.getSource('route')) {
    map.removeSource('route');
  }
};

const Quests = ({
  currentUserIds,
  map,
  setLockedUserId,
  lockedUserId,
  lockedUserData,
  isCreateQuestOpen,
  setIsCreateQuestOpen,
}) => {
  console.log('Quests component rendering');
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
  const [acceptors, setAcceptors] = useState({
    acceptors: [],
    pendingAcceptors: [],
  });
  const [showAcceptorsModal, setShowAcceptorsModal] = useState(false);
  const [selectedAcceptor, setSelectedAcceptor] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [activeQuests, setActiveQuests] = useState([]);
  const [activeTab, setActiveTab] = useState('public');

  // New state for managing the container height
  const [containerHeight, setContainerHeight] = useState(
    window.innerHeight * 0.5
  );

  const { showNotification } = useNotification();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersQuery = query(collection(db, 'users'));
        const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
          if (snapshot.empty) {
            console.error('No users found.');
            setUsers([]);
            return;
          }
          const fetchedUsers = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setUsers(fetchedUsers);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (auth.currentUser) {
      const fetchQuests = async () => {
        try {
          const publicQuestsQuery = query(
            collection(db, 'quests'),
            where('isPublic', '==', true)
          );
          const createdQuestsQuery = query(
            collection(db, 'quests'),
            where('uid', '==', auth.currentUser.uid)
          );
          const targetQuestsQuery = query(
            collection(db, 'quests'),
            where('targetUser', '==', auth.currentUser.uid)
          );

          const [publicSnapshot, createdSnapshot, targetSnapshot] =
            await Promise.all([
              getDocs(publicQuestsQuery),
              getDocs(createdQuestsQuery),
              getDocs(targetQuestsQuery),
            ]);

          const publicQuests = publicSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          const createdQuests = createdSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          const targetQuests = await Promise.all(
            targetSnapshot.docs.map(async (docSnap) => {
              const questData = docSnap.data();
              const senderDoc = await getDoc(doc(db, 'users', questData.uid));
              const senderData = senderDoc.exists() ? senderDoc.data() : {};
              return {
                id: docSnap.id,
                ...questData,
                senderName: senderData.name || 'Unknown sender',
              };
            })
          );

          const allQuests = [
            ...publicQuests,
            ...createdQuests,
            ...targetQuests,
          ];
          const uniqueQuests = new Map(allQuests.map((q) => [q.id, q]));
          setQuests(Array.from(uniqueQuests.values()));
        } catch (error) {
          console.error('Error fetching quests:', error);
        }
      };

      fetchQuests();
    }
  }, [auth.currentUser, showNotification, users]);

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfirmQuest = async () => {
    if (!auth.currentUser) {
      return;
    }

    if (!pendingQuest) {
      console.error('Pending quest is null.');
      return;
    }

    try {
      const questRef = doc(collection(db, 'quests'));
      if (pendingQuest.isPublic) {
        await setDoc(questRef, {
          ...pendingQuest,
          id: questRef.id,
          uid: auth.currentUser.uid,
          acceptedBy: [],
          pendingAcceptors: [],
        });
      } else {
        if (!pendingQuest.targetUser) {
          console.error('Target user is missing in the quest');
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
          showNotification(
            'A similar private quest already exists for this user.',
            'info'
          );
          return;
        }

        await setDoc(questRef, {
          ...pendingQuest,
          id: questRef.id,
          uid: auth.currentUser.uid,
          acceptedBy: [],
          pendingAcceptors: [],
        });
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

      if (
        !questData.isPublic &&
        questData.targetUser === auth.currentUser.uid
      ) {
        await deleteDoc(questRef);
        setQuests(quests.filter((quest) => quest.id !== questId));
        showNotification('Quest declined!', 'success');
      } else if (questData.isPublic) {
        await updateDoc(questRef, {
          declinedBy: arrayUnion(auth.currentUser.uid),
        });
        setQuests(quests.filter((quest) => quest.id !== questId));
        showNotification('Quest declined!', 'success');
      } else {
        const updatedAcceptedBy = questData.acceptedBy.filter(
          (id) => id !== auth.currentUser.uid
        );
        await updateDoc(questRef, { acceptedBy: updatedAcceptedBy });
        setQuests(
          quests.map((q) =>
            q.id === questId ? { ...q, acceptedBy: updatedAcceptedBy } : q
          )
        );
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
      showNotification('You must be logged in to accept quests.', 'error');
      return;
    }

    if (!quest.id) {
      console.error('Quest ID is missing');
      showNotification('Invalid quest. Please try again.', 'error');
      return;
    }

    try {
      const questRef = doc(db, 'quests', quest.id);
      const questDoc = await getDoc(questRef);

      if (!questDoc.exists()) {
        console.error('Quest does not exist');
        showNotification('This quest no longer exists.', 'error');
        return;
      }

      const currentQuestData = questDoc.data();

      let updatedQuest = {
        ...currentQuestData,
        status: quest.isPublic ? 'pending' : 'accepted',
      };

      if (quest.isPublic) {
        updatedQuest.pendingAcceptors = arrayUnion(auth.currentUser.uid);
      } else {
        updatedQuest.acceptedBy = auth.currentUser.uid;
      }

      const senderDoc = await getDoc(doc(db, 'users', quest.uid));
      const receiverDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));

      if (!senderDoc.exists() || !receiverDoc.exists()) {
        console.error('Sender or receiver data not found');
        showNotification(
          'Unable to process quest. User data missing.',
          'error'
        );
        return;
      }

      const senderData = senderDoc.data();
      const receiverData = receiverDoc.data();

      if (!senderData.location || !receiverData.location) {
        console.error('Sender or receiver location missing');
        showNotification(
          'Location data is missing. Unable to display route.',
          'warning'
        );
      } else {
        updatedQuest.routeInfo = {
          senderLocation: senderData.location,
          receiverLocation: receiverData.location,
        };
      }

      await updateDoc(questRef, updatedQuest);

      setQuests((prevQuests) =>
        prevQuests.map((q) => (q.id === quest.id ? updatedQuest : q))
      );

      if (!quest.isPublic) {
        setActiveQuests((prevActiveQuests) => [
          ...prevActiveQuests,
          updatedQuest,
        ]);

        if (updatedQuest.routeInfo && map) {
          displayRoute(
            map,
            updatedQuest.routeInfo.senderLocation,
            updatedQuest.routeInfo.receiverLocation
          );
        }
      }

      showNotification('Quest accepted!', 'success');

      if (quest.isPublic) {
        const notificationRef = doc(collection(db, 'notifications'));
        await setDoc(notificationRef, {
          type: 'quest_accepted',
          questId: quest.id,
          recipientId: quest.uid,
          senderId: auth.currentUser.uid,
          content: `${
            auth.currentUser.displayName || 'Someone'
          } has accepted your quest: ${quest.title}`,
          createdAt: new Date(),
          read: false,
        });
      }
    } catch (error) {
      console.error('Error accepting quest:', error);
      showNotification('Failed to accept quest. Please try again.', 'error');
    }
  };

  const displayRoute = useCallback(
    (senderLocation, receiverLocation) => {
      if (!map || !map.loaded()) {
        console.error('Map is not fully loaded');
        return;
      }

      if (!senderLocation || !receiverLocation) {
        console.error('Invalid locations for route display');
        return;
      }

      const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${senderLocation.longitude},${senderLocation.latitude};${receiverLocation.longitude},${receiverLocation.latitude}?geometries=geojson&access_token=${mapboxgl.accessToken}`;

      fetch(url)
        .then((response) => response.json())
        .then((data) => {
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
                data: route,
              },
              layout: {
                'line-join': 'round',
                'line-cap': 'round',
              },
              paint: {
                'line-color': '#00FFFF',
                'line-width': 5,
                'line-opacity': 0.75,
              },
            });
          }

          const bounds = new mapboxgl.LngLatBounds()
            .extend([senderLocation.longitude, senderLocation.latitude])
            .extend([receiverLocation.longitude, receiverLocation.latitude]);
          map.fitBounds(bounds, { padding: 50 });
        })
        .catch((error) => {
          console.error('Error fetching or displaying route:', error);
        });
    },
    [map]
  );

  useEffect(() => {
    if (auth.currentUser && map) {
      const unsubscribe = onSnapshot(
        query(
          collection(db, 'quests'),
          where('status', 'in', ['approved', 'accepted']),
          where('uid', '==', auth.currentUser.uid)
        ),
        (snapshot) => {
          const userQuests = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setActiveQuests(userQuests);

          userQuests.forEach((quest) => {
            if (!quest.isPublic && quest.routeInfo) {
              displayRoute(
                quest.routeInfo.senderLocation,
                quest.routeInfo.receiverLocation
              );
            }
          });
        }
      );

      return () => unsubscribe();
    }
  }, [auth.currentUser, map, displayRoute]);

  const handleApproveAcceptor = async (questId, acceptor) => {
    console.log('Approving acceptor:', acceptor);

    if (!acceptor || !acceptor.id) {
      console.error('Selected acceptor is not defined or missing id.');
      showNotification('Invalid acceptor data.', 'error');
      return;
    }

    try {
      const questRef = doc(db, 'quests', questId);
      const questDoc = await getDoc(questRef);

      if (!questDoc.exists()) {
        console.error('Quest document does not exist.');
        showNotification('Quest not found.', 'error');
        return;
      }

      const questData = questDoc.data();

      const updatedQuest = {
        ...questData,
        pendingAcceptors: arrayRemove(acceptor.id),
        acceptedBy: arrayUnion(acceptor.id),
        targetUser: acceptor.id,
        status: 'approved',
      };

      if (auth.currentUser) {
        const senderRef = doc(db, 'users', auth.currentUser.uid);
        const receiverRef = doc(db, 'users', acceptor.id);

        const [senderDoc, receiverDoc] = await Promise.all([
          getDoc(senderRef),
          getDoc(receiverRef),
        ]);

        if (senderDoc.exists() && receiverDoc.exists()) {
          const senderData = senderDoc.data();
          const receiverData = receiverDoc.data();

          if (senderData.location && receiverData.location) {
            updatedQuest.routeInfo = {
              senderLocation: senderData.location,
              receiverLocation: receiverData.location,
            };
          }
        }
      }

      await updateDoc(questRef, updatedQuest);

      setQuests((prevQuests) =>
        prevQuests.map((q) =>
          q.id === questId ? { ...q, ...updatedQuest } : q
        )
      );
      setActiveQuests((prevActiveQuests) => [
        ...prevActiveQuests,
        { ...questData, ...updatedQuest, id: questId },
      ]);

      if (updatedQuest.routeInfo && map) {
        displayRoute(
          map,
          updatedQuest.routeInfo.senderLocation,
          updatedQuest.routeInfo.receiverLocation
        );
      }

      showNotification(`Quest approved for ${acceptor.name}!`, 'success');
      setShowAcceptorsModal(false);
    } catch (error) {
      console.error('Error approving acceptor:', error);
      showNotification('Failed to approve acceptor.', 'error');
    }
  };

  const handleCompleteQuest = async (questId) => {
    try {
      const questRef = doc(db, 'quests', questId);
      await deleteDoc(questRef);
      setQuests(quests.filter((quest) => quest.id !== questId));
      setActiveQuests(activeQuests.filter((quest) => quest.id !== questId));

      if (map) {
        removeRoute(map);
      }

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
      setQuests(quests.filter((quest) => quest.id !== questId));
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

      const acceptors = await Promise.all(
        acceptorsIds.map(async (id) => {
          const userDoc = await getDoc(doc(db, 'users', id));
          return { id, ...userDoc.data() };
        })
      );

      const pendingAcceptors = await Promise.all(
        pendingAcceptorsIds.map(async (id) => {
          const userDoc = await getDoc(doc(db, 'users', id));
          return { id, ...userDoc.data() };
        })
      );

      setAcceptors({ acceptors, pendingAcceptors });
      setSelectedQuest(quest);
      setShowAcceptorsModal(true);
    } catch (error) {
      console.error('Error fetching acceptors:', error);
      showNotification('Failed to fetch acceptors.', 'error');
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

  const filteredQuests = quests.filter((quest) => {
    if (quest.isPublic) {
      return (
        quest.uid === auth.currentUser?.uid ||
        quest.approvedUser === auth.currentUser?.uid
      );
    } else {
      return (
        quest.targetUser === auth.currentUser?.uid ||
        quest.uid === auth.currentUser?.uid
      );
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
      setQuests(
        quests.map((q) =>
          q.id === quest.id
            ? { ...q, acceptedBy: user.id, pendingAcceptors: [] }
            : q
        )
      );
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'public':
        return (
          <div className="quests-column">
            <h3>Public Quests</h3>
            {filteredQuests.filter(
              (quest) =>
                quest.isPublic &&
                (!quest.declinedBy ||
                  !quest.declinedBy.includes(auth.currentUser?.uid))
            ).length > 0 ? (
              filteredQuests
                .filter(
                  (quest) =>
                    quest.isPublic &&
                    (!quest.declinedBy ||
                      !quest.declinedBy.includes(auth.currentUser?.uid))
                )
                .map((quest) => {
                  const sender =
                    users.find((user) => user.id === quest.uid) || {};
                  const senderName = sender.name || '';

                  return (
                    <div key={quest.id} className="quest-item">
                      <p>
                        <strong>Title:</strong> {quest.title}
                      </p>
                      <p>
                        <strong>Description:</strong> {quest.description}
                      </p>
                      <p>
                        <strong>Time Frame:</strong> {quest.timeFrame}
                      </p>
                      <p>
                        <strong>Sender:</strong> {senderName}
                      </p>

                      {quest.isPublic &&
                        auth.currentUser?.uid !== quest.uid &&
                        !(
                          Array.isArray(quest.acceptedBy) &&
                          quest.acceptedBy.includes(auth.currentUser?.uid)
                        ) &&
                        !(
                          Array.isArray(quest.pendingAcceptors) &&
                          quest.pendingAcceptors.includes(auth.currentUser?.uid)
                        ) && (
                          <div className="quest-actions">
                            <button
                              className="confirm-button"
                              onClick={() => handleAcceptQuest(quest)}
                            >
                              Accept
                            </button>
                            <button
                              className="cancel-button"
                              onClick={() => handleDeclineQuest(quest.id)}
                            >
                              Decline
                            </button>
                          </div>
                        )}

                      {quest.uid === auth.currentUser?.uid && (
                        <div className="quest-actions">
                          <button
                            className="select-button"
                            onClick={() => handleViewAcceptors(quest)}
                          >
                            View Pending Acceptors
                          </button>
                          <button
                            className="cancel-button"
                            onClick={() => handleCancelQuest(quest.id)}
                          >
                            Cancel Quest
                          </button>
                        </div>
                      )}

                      {Array.isArray(quest.acceptedBy) &&
                        quest.acceptedBy.includes(auth.currentUser?.uid) && (
                          <div className="quest-actions">
                            <button
                              className="confirm-button"
                              onClick={() => handleCompleteQuest(quest.id)}
                            >
                              Complete
                            </button>
                          </div>
                        )}
                    </div>
                  );
                })
            ) : (
              <p>No public quests.</p>
            )}
          </div>
        );
      case 'received':
        return (
          <div className="quests-column">
            <h3>Received Quests</h3>
            {quests.filter(
              (quest) =>
                quest.targetUser === auth.currentUser?.uid && !quest.isPublic
            ).length > 0 ? (
              quests
                .filter(
                  (quest) =>
                    quest.targetUser === auth.currentUser?.uid &&
                    !quest.isPublic
                )
                .map((quest) => {
                  const sender =
                    users.find((user) => user.id === quest.uid) || {};
                  const senderName = sender.name || '';
                  const isRecipient =
                    quest.targetUser === auth.currentUser?.uid;
                  const isSender = quest.uid === auth.currentUser?.uid;

                  return (
                    <div key={quest.id} className="quest-item">
                      <p>
                        <strong>Title:</strong> {quest.title}
                      </p>
                      <p>
                        <strong>Description:</strong> {quest.description}
                      </p>
                      <p>
                        <strong>Time Frame:</strong> {quest.timeFrame}
                      </p>
                      <p>
                        <strong>Sender:</strong> {senderName}
                      </p>
                      {isRecipient && quest.status === 'accepted' && (
                        <div className="quest-actions">
                          <button
                            className="confirm-button"
                            onClick={() => handleCompleteQuest(quest.id)}
                          >
                            Complete
                          </button>
                          <button
                            className="cancel-button"
                            onClick={() => handleCancelQuest(quest.id)}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      {isRecipient && quest.status === 'pending' && (
                        <div className="quest-actions">
                          <button
                            className="confirm-button"
                            onClick={() => handleAcceptQuest(quest)}
                          >
                            Accept
                          </button>
                          <button
                            className="cancel-button"
                            onClick={() => handleDeclineQuest(quest.id)}
                          >
                            Decline
                          </button>
                        </div>
                      )}
                      {isSender && <p>Status: {quest.status}</p>}
                      {quest.acceptedBy && (
                        <div>
                          <p>
                            <strong>Accepted By:</strong>{' '}
                            {users.find((user) => user.id === quest.acceptedBy)
                              ?.name || 'Pending acceptance'}
                          </p>
                          <img
                            src={
                              users.find((user) => user.id === quest.acceptedBy)
                                ?.profilePhotoUrl || '/default-profile.png'
                            }
                            alt="Profile"
                            className="user-pfp"
                          />
                        </div>
                      )}
                    </div>
                  );
                })
            ) : (
              <p>No received quests.</p>
            )}
          </div>
        );
      case 'sent':
        return (
          <div className="quests-column">
            <h3>Sent Quests</h3>
            {quests.filter(
              (quest) => quest.uid === auth.currentUser?.uid && !quest.isPublic
            ).length > 0 ? (
              quests
                .filter(
                  (quest) =>
                    quest.uid === auth.currentUser?.uid && !quest.isPublic
                )
                .map((quest) => {
                  const acceptor =
                    users.find((user) => user.id === quest.acceptedBy) || {};
                  const acceptorName = acceptor.name || '';
                  const pendingAcceptors = users.filter(
                    (user) =>
                      quest.pendingAcceptors &&
                      quest.pendingAcceptors.includes(user.id)
                  );

                  return (
                    <div key={quest.id} className="quest-item">
                      <p>
                        <strong>Title:</strong> {quest.title}
                      </p>
                      <p>
                        <strong>Description:</strong> {quest.description}
                      </p>
                      <p>
                        <strong>Time Frame:</strong> {quest.timeFrame}
                      </p>
                      <p>
                        <strong>Status:</strong> {quest.status}
                      </p>
                      {pendingAcceptors.length > 0 && (
                        <div>
                          <p>
                            <strong>Pending Acceptors:</strong>
                          </p>
                          <ul>
                            {pendingAcceptors.map((user) => (
                              <li
                                key={user.id}
                                onClick={() =>
                                  handleSelectAcceptor(quest, user)
                                }
                              >
                                {user.name}
                                <img
                                  src={
                                    user.profilePhotoUrl ||
                                    '/default-profile.png'
                                  }
                                  alt="Profile"
                                  className="user-pfp"
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {quest.acceptedBy && (
                        <div>
                          <p>
                            <strong>Accepted By:</strong> {acceptorName}
                          </p>
                          <img
                            src={
                              acceptor.profilePhotoUrl || '/default-profile.png'
                            }
                            alt="Profile"
                            className="user-pfp"
                          />
                        </div>
                      )}
                    </div>
                  );
                })
            ) : (
              <p>No sent quests.</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  // Draggable functionality
  const bindDrag = useDrag(({ movement: [, my], down }) => {
    if (down) {
      const newHeight = window.innerHeight * 0.5 - my;
      setContainerHeight(
        Math.max(100, Math.min(newHeight, window.innerHeight - 60))
      );
    }
  });

  const springProps = useSpring({
    height: containerHeight,
    config: { tension: 300, friction: 30 },
  });

  return (
    <NavigationModalWrapper>
      <div className="quests-page">
        <div className="drag-handle" {...bindDrag()} />
        <div className="quests-header">
          <h2>Quests</h2>
        </div>

        <div className="tabs">
          <button
            className={`tab-button ${activeTab === 'public' ? 'active' : ''}`}
            onClick={() => setActiveTab('public')}
          >
            Public Quests
          </button>
          <button
            className={`tab-button ${activeTab === 'received' ? 'active' : ''}`}
            onClick={() => setActiveTab('received')}
          >
            Received Quests
          </button>
          <button
            className={`tab-button ${activeTab === 'sent' ? 'active' : ''}`}
            onClick={() => setActiveTab('sent')}
          >
            Sent Quests
          </button>
        </div>

        {renderTabContent()}

        {confirmationDialogOpen && pendingQuest && (
          <div className="modal-overlay">
            <div className="modal confirmation-dialog">
              <h3>Confirm Quest Sending</h3>
              <p>
                Are you sure you want to send the quest with the following
                details?
              </p>
              <p>
                <strong>Title:</strong> {pendingQuest.title}
              </p>
              <p>
                <strong>Description:</strong> {pendingQuest.description}
              </p>
              <p>
                <strong>Time Frame:</strong> {pendingQuest.timeFrame}
              </p>
              <div className="modal-actions">
                <button className="confirm-button" onClick={handleConfirmQuest}>
                  Confirm
                </button>
                <button
                  className="cancel-button"
                  onClick={() => setConfirmationDialogOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedProfile && (
          <div className="modal-overlay">
            <div className="modal profile-popup">
              <button className="close-button" onClick={closeProfilePopup}>
                X
              </button>
              <h3>{selectedProfile.name}</h3>
              <img
                src={selectedProfile.profilePhotoUrl || '/default-profile.png'}
                alt="Profile"
                className="profile-pic"
              />
              <p>
                <strong>Bio:</strong> {selectedProfile.bio}
              </p>
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
                  <li
                    key={index}
                    onClick={() =>
                      handleApproveAcceptor(selectedQuest.id, user)
                    }
                    className="selectable-user"
                  >
                    {user.name}
                  </li>
                ))}
              </ul>
              <button
                className="close-button"
                onClick={() => setShowAcceptorsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </NavigationModalWrapper>
  );
};

export default Quests;
