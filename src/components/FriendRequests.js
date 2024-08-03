import { collection, addDoc, onSnapshot, doc, updateDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase.js'; // Adjust path as needed

// Function to add a friend request
export const addFriendRequest = async (receiverId) => {
  if (!receiverId) {
    console.error('Receiver ID is undefined.');
    return;
  }

  try {
    await addDoc(collection(db, 'friend_requests'), {
      senderId: auth.currentUser.uid,
      receiverId,
      status: 'pending',
      timestamp: serverTimestamp() // Use serverTimestamp for consistency
    });
    console.log('Friend request sent!');
  } catch (error) {
    console.error('Error sending friend request:', error);
  }
};

// Function to fetch friend requests
export const fetchFriendRequests = async () => {
  try {
    const requestsSnapshot = await getDocs(collection(db, 'friend_requests'));
    return requestsSnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error fetching friend requests:', error);
  }
};

// Function to update the status of a friend request
export const updateFriendRequestStatus = async (requestId, status) => {
  try {
    const requestRef = doc(db, 'friend_requests', requestId);
    await updateDoc(requestRef, { status });
    console.log('Friend request status updated!');
  } catch (error) {
    console.error('Error updating friend request status:', error);
  }
};

// Function to listen for friend requests
export const listenForFriendRequests = (callback) => {
  return onSnapshot(collection(db, 'friend_requests'), (snapshot) => {
    const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(requests);
  });
};