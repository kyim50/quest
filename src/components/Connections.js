import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, doc, serverTimestamp, arrayRemove, getDoc, arrayUnion, query, where, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import './connections.css';
import { centerMapOnUser } from './UserLocationService';
import chatIcon from './chatbubble.png';

const Connections = ({ currentUserIds, map, setLockedUserId, lockedUserId, lockedUserData }) => {
  const [people, setPeople] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState('');
  const [chatUser, setChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [lockedUser, setLockedUser] = useState(null);
  const [activeTab, setActiveTab] = useState('friends');

  const fetchPeople = useCallback(async () => {
    if (!auth.currentUser) {
      console.error('User is not authenticated');
      return;
    }

    const usersCollection = collection(db, 'users');
    const activeUsersQuery = query(usersCollection, where('isActive', '==', true));
    const querySnapshot = await getDocs(activeUsersQuery);
    const usersList = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(user =>
        user.id !== auth.currentUser.uid &&
        !friends.some(friend => friend.id === user.id) &&
        currentUserIds.includes(user.id)
      );

    setPeople(usersList);
  }, [friends, currentUserIds]);

  const fetchFriends = useCallback(async () => {
    if (!auth.currentUser) {
      console.error('User is not authenticated');
      return;
    }

    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();

      const friendsList = userData?.friends || [];
      const friendsDetails = await Promise.all(
        friendsList.map(async friendId => {
          const friendDocRef = doc(db, 'users', friendId);
          const friendDoc = await getDoc(friendDocRef);
          return { id: friendId, ...friendDoc.data() };
        })
      );

      setFriends(friendsDetails);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  }, []);

  useEffect(() => {
    if (!auth.currentUser) {
      console.error('User is not authenticated');
      return;
    }

    const unsubscribeRequests = onSnapshot(collection(db, 'friend_requests'), async (snapshot) => {
      const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const pending = requests.filter(req => req.status === 'pending' && req.receiverId === auth.currentUser.uid);
      const accepted = requests.filter(req => req.status === 'accepted' && (req.senderId === auth.currentUser.uid || req.receiverId === auth.currentUser.uid));

      const acceptedFriendsIds = accepted.map(req => req.senderId === auth.currentUser.uid ? req.receiverId : req.senderId);

      fetchFriends().then(() => {
        setFriends(prevFriends =>
          prevFriends.filter(friend => acceptedFriendsIds.includes(friend.id))
        );
      });

      const pendingRequestsDetails = await Promise.all(
        pending.map(async req => {
          const senderDocRef = doc(db, 'users', req.senderId);
          const senderDoc = await getDoc(senderDocRef);
          const senderData = senderDoc.data();
          return {
            id: req.id,
            senderId: req.senderId,
            senderName: senderData?.name || 'User',
            senderPhoto: senderData?.profilePhoto || 'default_photo_url'
          };
        })
      );

      setPendingRequests(pendingRequestsDetails);

      fetchPeople();
    });

    fetchFriends();

    return () => unsubscribeRequests();
  }, [fetchPeople, fetchFriends]);

  const handleAddFriend = async (receiverId) => {
    console.log('Attempting to send friend request to:', receiverId);
    if (!receiverId) {
      console.error('Receiver ID is undefined.');
      return;
    }

    try {
      const existingRequestsQuery = query(collection(db, 'friend_requests'),
        where('senderId', '==', auth.currentUser.uid),
        where('receiverId', '==', receiverId),
        where('status', '==', 'pending')
      );
      const existingRequestsSnapshot = await getDocs(existingRequestsQuery);

      if (!existingRequestsSnapshot.empty) {
        console.log('Friend request already exists');
        setNotification('Friend request already exists!');
        return;
      }

      await addDoc(collection(db, 'friend_requests'), {
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName,
        senderPhoto: auth.currentUser.photoURL,
        receiverId,
        status: 'pending',
        timestamp: serverTimestamp()
      });
      setNotification('Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleAcceptRequest = async (requestId, senderId) => {
    try {
      await updateDoc(doc(db, 'friend_requests', requestId), { status: 'accepted' });

      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        friends: arrayUnion(senderId)
      });
      await updateDoc(doc(db, 'users', senderId), {
        friends: arrayUnion(auth.currentUser.uid)
      });

      setNotification('Friend request accepted!');
      fetchFriends();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      await deleteDoc(doc(db, 'friend_requests', requestId));
      setNotification('Friend request declined!');
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        friends: arrayRemove(friendId)
      });
      await updateDoc(doc(db, 'users', friendId), {
        friends: arrayRemove(auth.currentUser.uid)
      });

      setFriends(prevFriends => prevFriends.filter(friend => friend.id !== friendId));
      setNotification('Friend removed!');
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const handleUserClick = async (user) => {
    if (lockedUser === user.id) {
      setLockedUser(null);
      if (map && auth.currentUser) {
        centerMapOnUser(map, auth.currentUser.uid);
        setTimeout(() => map.resize(), 300); // Trigger resize after animation
      }
    } else {
      setLockedUser(user.id);
      const userDoc = await getDoc(doc(db, 'users', user.id));
      const userData = userDoc.data();
      if (userData && userData.location && map) {
        centerMapOnUser(map, user.id);
        setTimeout(() => map.resize(), 300); // Trigger resize after animation
      }
    }
  };
  
  const handleClosePopup = () => {
    setSelectedUser(null);
  };

  const handleButtonClick = (user) => {
    console.log('Button clicked for user:', user);
    if (selectedUser === user) {
      if (user.id) {
        handleAddFriend(user.id);
      } else {
        console.error('Selected user ID is missing.');
      }
    } else {
      handleUserClick(user);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleChatClick = (user) => {
    setChatUser(user);
    fetchChatHistory(user.id);
    updateChatHistory(user);
  };

  const handleCloseChat = () => {
    setChatUser(null);
    setMessages([]);
  };

  const updateChatHistory = (user) => {
    setChatHistory(prevHistory => {
      const updatedHistory = prevHistory.filter(item => item.id !== user.id);
      return [user, ...updatedHistory];
    });
  };

  const fetchChatHistory = async (userId) => {
    if (!auth.currentUser) {
      console.error('User is not authenticated');
      return;
    }

    const messagesCollection = collection(db, 'messages');
    const q = query(messagesCollection,
      where('senderId', 'in', [auth.currentUser.uid, userId]),
      where('receiverId', 'in', [auth.currentUser.uid, userId]),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const querySnapshot = await getDocs(q);
    const chatHistory = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
    setMessages(chatHistory);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await addDoc(collection(db, 'messages'), {
        senderId: auth.currentUser.uid,
        receiverId: chatUser.id,
        content: newMessage,
        timestamp: serverTimestamp()
      });

      setNewMessage('');
      updateChatHistory(chatUser);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    updateDoc(doc(db, 'users', auth.currentUser.uid), { isTyping: true });

    const newTimeout = setTimeout(() => {
      updateDoc(doc(db, 'users', auth.currentUser.uid), { isTyping: false });
    }, 2000);

    setTypingTimeout(newTimeout);
  };

  useEffect(() => {
    if (chatUser) {
      const unsubscribeMessages = onSnapshot(
        query(
          collection(db, 'messages'),
          where('senderId', 'in', [auth.currentUser.uid, chatUser.id]),
          where('receiverId', 'in', [auth.currentUser.uid, chatUser.id]),
          orderBy('timestamp')
        ),
        (snapshot) => {
          const chatHistory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMessages(chatHistory);
        }
      );

      const unsubscribeTyping = onSnapshot(
        doc(db, 'users', chatUser.id),
        (doc) => {
          const userData = doc.data();
          if (userData && userData.isTyping) {
            setIsTyping(true);
          } else {
            setIsTyping(false);
          }
        }
      );

      return () => {
        unsubscribeMessages();
        unsubscribeTyping();
      };
    }
  }, [chatUser]);

  const filteredPeople = people.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderLockedUserProfile = () => {
    if (!lockedUser) return null;

    const user = people.find(p => p.id === lockedUser) || friends.find(f => f.id === lockedUser);
    if (!user) return null;

    const isFriend = friends.some(friend => friend.id === user.id);
    

    return (
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-photo-container">
            <img src={user.profilePhoto} alt="Profile" className="profile-photo" />
          </div>
          <div className="profile-name-status">
            <h2 className="profile-name">{user.name}</h2>
            <p className="profile-status"><span className="status-dot"></span> Active</p>
          </div>
        </div>

        <div className="profile-section">
          <h3 className="section-title">Bio</h3>
          <p className="profile-bio">{user.bio || "No bio available"}</p>
        </div>

        <div className="profile-section">
          <h3 className="section-title">Tags</h3>
          <div className="tags-container">
            {user.tags && user.tags.map((tag) => (
              <div key={tag} className="tag">
                {tag}
              </div>
            ))}
          </div>
        </div>

        <div className="profile-actions">
          <button className="add-friend-btn1" onClick={() => handleAddFriend(user.id)}>
            Add Friend
          </button>
          <button className="chat-btn2" onClick={() => handleChatClick(user)}>
          <img src={chatIcon} alt="Chat" className='icon-img' />

          </button>
        </div>

        <button className="unlock-btn1" onClick={() => setLockedUser(null)}>
          Unlock User
        </button>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'friends':
        return (
          <div className="friends-section">
            <h2>Friends</h2>
            {friends.map(friend => (
              <div key={friend.id} className="friend-item" onClick={() => handleUserClick(friend)}>
                <img src={friend.profilePhoto} alt="Friend" />
                <div>{friend.name}</div>
                <div className="button-group">
                  <button className="remove-friend-btn1" onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFriend(friend.id);
                  }}>Remove</button>
                  <button className="chat-btn1" onClick={(e) => {
                    e.stopPropagation();
                    handleChatClick(friend);
                  }}>                  <img src={chatIcon} alt="Chat" className='icon-img' />
</button>
                </div>
              </div>
            ))}
          </div>
        );
      case 'pending':
        return (
          <div className="pending-requests-section">
            <h2>Pending Requests</h2>
            {pendingRequests.map(request => (
              <div key={request.id} className="pending-request">
                <img src={request.senderPhoto} alt="User" />
                <div>{request.senderName}</div>
                <div className="button-group">
                  <button className="accept-btn" onClick={() => handleAcceptRequest(request.id, request.senderId)}>Accept</button>
                  <button className="decline-btn" onClick={() => handleDeclineRequest(request.id)}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        );
        case 'people':
      return (
        <div className="people-section">
          <h2>People</h2>
          {filteredPeople.map(user => (
            <div 
              key={user.id} 
              className={`people-item ${lockedUser === user.id ? 'locked' : ''}`}
              onClick={() => handleUserClick(user)}
            >
              <img src={user.profilePhoto} alt="User" />
              <div>{user.name}</div>
              <div className="button-group">
                <button className="add-friend-btn1" onClick={(e) => {
                  e.stopPropagation();
                  handleAddFriend(user.id);
                }}>
                  Add Friend
                </button>
                <button className="chat-btn1" onClick={(e) => {
                  e.stopPropagation();
                  handleChatClick(user);
                }}>
                  <img src={chatIcon} alt="Chat" className='icon-img' />
                </button>
              </div>
            </div>
          ))}
        </div>
      );
      case 'recentChats':
        return (
          <div className="recent-chats-section">
            <h2>Recent Chats</h2>
            {chatHistory.map(user => (
              <div key={user.id} className="chat-history-item" onClick={() => handleChatClick(user)}>
                <img src={user.profilePhoto} alt="Profile" />
                <div>{user.name}</div>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`connections-container1 ${lockedUser ? 'user-locked1' : ''}`}>
      {notification && <div className="notification1">{notification}</div>}

      {lockedUser ? (
        renderLockedUserProfile()
      ) : (
        <>
          <div className="search-bar1">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          <div className="tabs1">
            <button 
              className={`tab-button1 ${activeTab === 'friends' ? 'active1' : ''}`}
              onClick={() => setActiveTab('friends')}
            >
              Friends
            </button>
            <button 
              className={`tab-button1 ${activeTab === 'pending' ? 'active1' : ''}`}
              onClick={() => setActiveTab('pending')}
            >
              Pending Requests
            </button>
            <button 
              className={`tab-button1 ${activeTab === 'people' ? 'active1' : ''}`}
              onClick={() => setActiveTab('people')}
            >
              People
            </button>
            <button 
              className={`tab-button1 ${activeTab === 'recentChats' ? 'active1' : ''}`}
              onClick={() => setActiveTab('recentChats')}
            >
              Recent Chats
            </button>
          </div>

          {renderTabContent()}
        </>
      )}

      {selectedUser && (
        <div className="user-popup1">
          <button className="close-popup1" onClick={handleClosePopup}>×</button>
          <img src={selectedUser.profilePhoto} alt="Profile" />
          <div>{selectedUser.name}</div>
          <div>{selectedUser.bio}</div>
          <button className="view-profile-btn1" onClick={() => handleAddFriend(selectedUser.id)}>Add Friend</button>
          <button className="remove-friend-btn1" onClick={() => handleRemoveFriend(selectedUser.id)}>Remove</button>
        </div>
      )}

      {chatUser && (
        <div className="chat-container1">
          <div className="chat-header1">
            <button className="back-btn1" onClick={handleCloseChat}>←</button>
            <img src={chatUser.profilePhoto} alt="Profile" />
            <div>{chatUser.name}</div>
          </div>
          <div className="chat-messages1">
            {messages.map(msg => (
              <div key={msg.id} className={`message1 ${msg.senderId === auth.currentUser.uid ? 'sent1' : 'received1'}`}>
                <div>{msg.content}</div>
              </div>
            ))}
            {isTyping && (
              <div className="typing-indicator1">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>
          <div className="chat-input1">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={handleInputChange}
            />
            <button onClick={handleSendMessage}><img className="sendchatimg" src="sendchat.png"/></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Connections;