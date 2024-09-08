import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword as createUser,
  signInWithEmailAndPassword as signIn,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// Your web app's Firebase configuration
 const firebaseConfig = {
  apiKey: "AIzaSyC2wTEeSiz_09FzWarn52vwzSlzfHXjATE",
  authDomain: "quests-b5b92.firebaseapp.com",
  databaseURL: "https://quests-b5b92-default-rtdb.firebaseio.com",
  projectId: "quests-b5b92",
  storageBucket: "quests-b5b92.appspot.com",
  messagingSenderId: "388972050284",
  appId: "1:388972050284:web:38dfdb79a67edcf0756549",
  measurementId: "G-Y1P89CPKCY"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication, Firestore, and Storage
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Sign up with email and password
// Sign up with email and password
export const signUpWithEmailAndPassword = async (email, password, name) => {
  try {
    const userCredential = await createUser(auth, email, password);
    const userId = userCredential.user.uid;

    // Set the user document with senderId, receiverId, and isPrivate initialized to false
    await setDoc(doc(db, 'users', userId), {
      name: name,
      email: email,
      profilePhoto: await getDefaultProfilePhotoURL(), // Use the default photo URL
      bio: '',
      isActive: true, // Set isActive to true when user signs up
      lastActive: Date.now(), // Set lastActive to the current Unix timestamp
      receiverId: userId, // Initialize receiverId as userId
      senderId: userId, // Initialize senderId as userId
      isPrivate: false // Initialize isPrivate to false
    });

    return userCredential;
  } catch (error) {
    console.error('Error signing up:', error);
  }
};


// Create a Google Auth provider instance
export const googleProvider = new GoogleAuthProvider();

// Function to sign up with Google
// Function to sign up with Google
export const signUpWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const userDocRef = doc(db, 'users', user.uid);

    // Check if user already exists in Firestore
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      // Add new user to Firestore with Google profile photo and isPrivate initialized to false
      await setDoc(userDocRef, {
        name: user.displayName || 'Unnamed',
        email: user.email,
        profilePhoto: user.photoURL || await getDefaultProfilePhotoURL(),
        bio: '',
        isActive: true,
        receiverId: user.uid, // Initialize receiverId as userId
        senderId: user.uid, // Initialize senderId as userId
        isPrivate: false // Initialize isPrivate to false
      });
    }

    return user;
  } catch (error) {
    console.error('Error signing up with Google:', error);
    throw error;
  }
};


// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    const user = result.user;

    await updateUserProfile(user.uid, { isActive: true, lastActive: Date.now() });

    console.log('User signed in with Google:', user);
    return user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
  }
};

// Sign in with email and password
// Sign in with email and password
export const signInWithEmailAndPassword = async (email, password) => {
  try {
    const userCredential = await signIn(auth, email, password);
    const userId = userCredential.user?.uid;

    if (userId) {
      await updateDoc(doc(db, 'users', userId), {
        isActive: true,
        lastActive: Date.now() // Update lastActive to the current Unix timestamp
      });
    } else {
      console.error('User ID is not available');
    }

    return userCredential;
  } catch (error) {
    console.error('Error signing in:', error);
  }
};


// Function to upload a file to Firebase Storage and get the download URL
export const uploadImage = async (file) => {
  const storage = getStorage();
  const storageRef = ref(storage, `profile_photos/${auth.currentUser.uid}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed',
      (snapshot) => {
        // You can handle progress here if needed
      },
      (error) => {
        console.error('Error uploading image:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (error) {
          console.error('Error getting download URL:', error);
          reject(error);
        }
      }
    );
  });
};


// Function to update user profile in Firestore
// Function to update user profile in Firestore
// Function to update user profile in Firestore
export const updateUserProfile = async (userId, profileData) => {
  try {
    console.log('Updating user profile:', userId, profileData);
    await updateDoc(doc(db, 'users', userId), profileData);
    console.log('User profile updated successfully');
  } catch (error) {
    console.error('Error updating user profile:', error);
  }
};



// Function to get the default profile photo URL
export const getDefaultProfilePhotoURL = async () => {
  return 'https://firebasestorage.googleapis.com/v0/b/quests-b5b92.appspot.com/o/profile_photos%2Fdefault.jpg?alt=media&token=e7424067-7007-4a70-a405-b56c83f0d9d2';
};

// Function to update user location
export const updateUserLocation = async (userId, location) => {
  try {
    console.log('Updating user location:', userId, location);
    await updateDoc(doc(db, 'users', userId), {
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        timestamp: Date.now() // Use Unix timestamp for location timestamp
      }
    });
    console.log('User location updated successfully');
  } catch (error) {
    console.error('Error updating user location:', error);
  }
};

// Function to get a user's profile and location
// Function to fetch a user's profile and location
export const getUserProfile = async (userId) => {
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log('No such document!');
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }
};

// Function to fetch user locations with privacy check
export const fetchUserLocations = async () => {
  const userDocRef = doc(db, 'users', auth.currentUser.uid);
  const userDoc = await getDoc(userDocRef);
  const userData = userDoc.data();
  const isPrivate = userData.isPrivate || false;

  let query = collection(db, 'users');
  if (isPrivate) {
    const friends = userData.friends || [];
    query = query.where('uid', 'in', friends);
  }

  const snapshot = await getDocs(query);
  // Process snapshot data...
};


// Function to fetch all user locations
export const fetchAllUserLocations = async () => {
  try {
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    return usersSnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error fetching all user locations:', error);
  }
};

// Function to fetch a specific user's data
export const fetchUserData = async (userId) => {
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log('No such document!');
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
};

// Function to set isActive to false for all users
export const setAllUsersInactive = async () => {
  try {
    const usersCollection = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    const batch = db.batch();

    usersSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { isActive: false });
    });

    await batch.commit();
    console.log('All users set to inactive successfully');
  } catch (error) {
    console.error('Error setting all users inactive:', error);
  }
};

// Function to add a friend to a user's friend list
export const addFriend = async (userId, friendId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const friendDocRef = doc(db, 'users', friendId);

    await updateDoc(userDocRef, {
      friends: arrayUnion(friendId)
    });

    await updateDoc(friendDocRef, {
      friends: arrayUnion(userId)
    });

    console.log('Friend added successfully');
  } catch (error) {
    console.error('Error adding friend:', error);
  }
};

// Function to remove a friend from a user's friend list
export const removeFriend = async (userId, friendId) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const friendDocRef = doc(db, 'users', friendId);

    await updateDoc(userDocRef, {
      friends: arrayRemove(friendId)
    });

    await updateDoc(friendDocRef, {
      friends: arrayRemove(userId)
    });

    console.log('Friend removed successfully');
  } catch (error) {
    console.error('Error removing friend:', error);
  }
};

// Function to update user's last active timestamp
export const updateLastActive = async (userId) => {
  if (!userId) {
    console.error('User ID is undefined');
    return;
  }
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      lastActive: Date.now() // Update lastActive to the current Unix timestamp
    });
    console.log('User last active timestamp updated successfully');
  } catch (error) {
    console.error('Error updating last active timestamp:', error);
  }
};

// Function to create a quest
export const createQuest = async (senderId, receiverId, questDetails) => {
  try {
    const questId = generateUniqueId(); // Implement a function to generate a unique quest ID
    await setDoc(doc(db, 'quests', questId), {
      senderId: senderId,
      receiverId: receiverId,
      ...questDetails,
      status: 'pending', // or other status like 'sent', 'received', etc.
      createdAt: Date.now()
    });

    console.log('Quest created successfully');
  } catch (error) {
    console.error('Error creating quest:', error);
  }
};

// Function to fetch sent quests
export const fetchSentQuests = async (userId) => {
  try {
    const questsRef = collection(db, 'quests');
    const q = query(questsRef, where('senderId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error fetching sent quests:', error);
  }
};

// Function to fetch received quests
export const fetchReceivedQuests = async (userId) => {
  try {
    const questsRef = collection(db, 'quests');
    const q = query(questsRef, where('receiverId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error fetching received quests:', error);
  }
};

// Function to generate a unique ID (implement as needed)
const generateUniqueId = () => {
  // You can use any method to generate unique IDs; this is just an example
  return Math.random().toString(36).substr(2, 9);
};

// Ensure setPersistence and browserLocalPersistence are exported
export { setPersistence, browserLocalPersistence, getDocs, updateDoc, doc, };

export default app;