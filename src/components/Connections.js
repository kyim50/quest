import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot, doc, serverTimestamp, arrayRemove, getDoc, arrayUnion, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import './connections.css'; // Import your CSS

const Connections = ({ currentUserIds = [] }) => {
  const [people, setPeople] = useState([]);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState('');
  const [chatUser, setChatUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Fetch active users who are not friends
  const fetchPeople = useCallback(async () => {
    if (!auth.currentUser) {
      console.error('User is not authenticated');
      return;
    }

    const usersCollection = collection(db, 'users');
    const querySnapshot = await getDocs(usersCollection);
    const usersList = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(user =>
        user.id !== auth.currentUser.uid &&
        !friends.some(friend => friend.id === user.id) &&
        user.isActive // Check if user is active
      );

    setPeople(usersList);
  }, [friends]);

  // Fetch friends of the current user
  const fetchFriends = useCallback(async () => {
    if (!auth.currentUser) {
      console.error('User is not authenticated');
      return;
    }

    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();

      // Ensure friends list exists and is an array
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

    // Subscribe to friend requests and friends updates
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
            senderName: senderData?.name || 'User', // Default to 'User' if name is missing
            senderPhoto: senderData?.profilePhoto || 'default_photo_url' // Default photo URL if missing
          };
        })
      );

      setPendingRequests(pendingRequestsDetails);

      // Update people list whenever friends list changes
      fetchPeople();
    });

    // Fetch friends initially
    fetchFriends();

    return () => unsubscribeRequests();
  }, [fetchPeople, fetchFriends]);

  const handleAddFriend = async (receiverId) => {
    console.log('Attempting to send friend request to:', receiverId); // Debugging
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
        senderName: auth.currentUser.displayName, // Assuming the user's name is stored in the displayName field
        senderPhoto: auth.currentUser.photoURL, // Assuming the user's photo URL is stored in the photoURL field
        receiverId,
        status: 'pending',
        timestamp: serverTimestamp() // Use serverTimestamp for consistency
      });
      setNotification('Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleAcceptRequest = async (requestId, senderId) => {
    try {
      await updateDoc(doc(db, 'friend_requests', requestId), { status: 'accepted' });

      // Update both users' friends lists
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
      // Remove friend from both users' friend lists
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        friends: arrayRemove(friendId)
      });
      await updateDoc(doc(db, 'users', friendId), {
        friends: arrayRemove(auth.currentUser.uid)
      });

      // Update the friends state
      setFriends(prevFriends => prevFriends.filter(friend => friend.id !== friendId));
      setNotification('Friend removed!');
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const handleUserClick = (user) => {
    console.log('User clicked:', user); // Debugging
    setSelectedUser(user);
  };

  const handleClosePopup = () => {
    setSelectedUser(null);
  };

  const handleButtonClick = (user) => {
    console.log('Button clicked for user:', user); // Debugging
    if (selectedUser === user) {
      if (user.id) {
        handleAddFriend(user.id); // Use user.id here
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
  };

  const handleCloseChat = () => {
    setChatUser(null);
    setMessages([]);
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
      orderBy('timestamp')
    );

    const querySnapshot = await getDocs(q);
    const chatHistory = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  useEffect(() => {
    if (chatUser) {
      const unsubscribeMessages = onSnapshot(collection(db, 'messages'), (snapshot) => {
        const chatHistory = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(msg =>
            (msg.senderId === auth.currentUser.uid && msg.receiverId === chatUser.id) ||
            (msg.senderId === chatUser.id && msg.receiverId === auth.currentUser.uid)
          )
          .sort((a, b) => a.timestamp.seconds - b.timestamp.seconds);

        setMessages(chatHistory);
      });

      return () => unsubscribeMessages();
    }
  }, [chatUser]);

  const filteredPeople = people.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="connections-container">
      {notification && <div className="notification">{notification}</div>}

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      <div className="friends-section">
        <h2>Friends</h2>
        {friends.map(friend => (
          <div key={friend.id} className="friend-item">
            <img src={friend.profilePhoto} alt="Friend" />
            <div>{friend.name}</div>
            <div className="button-group">
              <button className="remove-friend-btn" onClick={() => handleRemoveFriend(friend.id)}>Remove</button>
              <button className="chat-btn" onClick={() => handleChatClick(friend)}>Chat</button>
            </div>
          </div>
        ))}
      </div>

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

      <div className="people-section">
        <h2>People</h2>
        {filteredPeople.map(user => (
          <div key={user.id} className="people-item">
            <img src={user.profilePhoto} alt="User" />
            <div>{user.name}</div>
            <div className="button-group">
              <button className="view-profile-btn" onClick={() => handleButtonClick(user)}>+</button>
              <button className="chat-btn" onClick={() => handleChatClick(user)}>Chat</button>
            </div>
          </div>
        ))}
      </div>

      {selectedUser && (
        <div className="user-popup">
          <button className="close-popup" onClick={handleClosePopup}>×</button>
          <img src={selectedUser.profilePhoto} alt="Profile" />
          <div>{selectedUser.name}</div>
          <div>{selectedUser.bio}</div>
          <button className="view-profile-btn" onClick={() => handleAddFriend(selectedUser.id)}>+</button>
          <button className="remove-friend-btn" onClick={() => handleRemoveFriend(selectedUser.id)}>Remove</button>
        </div>
      )}

      {chatUser && (
        <div className="chat-container">
          <div className="chat-header">
            <button className="back-btn" onClick={handleCloseChat}>← Back</button>
            <img src={chatUser.profilePhoto} alt="Profile" />
            <div>{chatUser.name}</div>
          </div>
          <div className="chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`message ${msg.senderId === auth.currentUser.uid ? 'sent' : 'received'}`}>
                <div>{msg.content}</div>
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button onClick={handleSendMessage}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Connections;
