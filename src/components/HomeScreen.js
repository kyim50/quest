import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, TextField, Button, Badge, Radio, RadioGroup, FormControlLabel } from '@mui/material';
import { Search, Notifications, ArrowBack, CameraAlt, Refresh, Close, Delete, Send } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db, fetchUserData } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, setDoc, doc, serverTimestamp, query, where, orderBy, limit } from 'firebase/firestore';
import { Camera } from 'react-camera-pro';
import { useNotification } from '../NotificationContext';
import { checkAuthStatus, handleLogout } from './UserAuthService';
import MapComponent from './MapComponent';
import NavigationBar from './NavigationBar';
import UserProfile from './UserProfile';
import QuestsComponent from './QuestsComponent';
import Connections from './Connections';
import HistorySection from './HistorySection';
import PrivacySection from './PrivacySection';
import PhotoUploadPreview from './PhotoUploadPreview';
import '../styles/HomeScreen.css';

const HomeScreen = React.memo(() => {
  const [activeSection, setActiveSection] = useState('');
  const [currentUserIds, setCurrentUserIds] = useState([]);
  const [address, setAddress] = useState('Loading address...');
  const [map, setMap] = useState(null);
  const [lockedUser, setLockedUser] = useState(null);
  const [lockedUserData, setLockedUserData] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [showCamera, setShowCamera] = useState(false);
  const [userProfileData, setUserProfileData] = useState(null);
  const [showFullMap, setShowFullMap] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoSize, setPhotoSize] = useState('medium');
  const [friendsList, setFriendsList] = useState([]);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [caption, setCaption] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [gridData, setGridData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const cameraRef = useRef(null);
  const imagePreviewRef = useRef(null);

  const fetchUserDataCallback = useCallback(async (uid) => {
    return await fetchUserData(uid);
  }, []);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userData = await fetchUserDataCallback(user.uid);
        if (userData) {
          setCurrentUser({ uid: user.uid, ...userData });
          setUserProfileData(userData);
        } else {
          console.error("User document not found");
        }
      } else {
        setCurrentUser(null);
        setUserProfileData(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribeAuth();
  }, [fetchUserDataCallback]);

  useEffect(() => {
    const unsubscribeAuth = checkAuthStatus(navigate);
    return () => unsubscribeAuth();
  }, [navigate]);

  const fetchFriends = useCallback(async () => {
    if (auth.currentUser) {
      const friendsRef = collection(db, 'users', auth.currentUser.uid, 'friends');
      const friendsSnapshot = await getDocs(friendsRef);
      const friendIds = friendsSnapshot.docs.map(doc => doc.id);
      setFriendsList(friendIds);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  const showSection = useCallback((sectionId) => {
    setActiveSection(prevSection => sectionId === prevSection ? '' : sectionId);
    setShowFullMap(false);
  }, []);

  const handleSetLockedUser = useCallback(async (userId) => {
    if (userId) {
      try {
        const userData = await fetchUserDataCallback(userId);
        if (userData) {
          setLockedUser(userId);
          setLockedUserData({ id: userId, ...userData });
          setActiveSection('connections');
          if (map) {
            map.flyTo({
              center: [userData.location.longitude, userData.location.latitude],
              zoom: 15
            });
          }
        } else {
          console.error("No user found with ID:", userId);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    } else {
      setLockedUser(null);
      setLockedUserData(null);
      if (map && auth.currentUser) {
        const currentUserData = await fetchUserDataCallback(auth.currentUser.uid);
        map.flyTo({
          center: [currentUserData.location.longitude, currentUserData.location.latitude],
          zoom: 15
        });
      }
    }
  }, [map, fetchUserDataCallback]);

  const handleCapture = useCallback(() => {
    const imageSrc = cameraRef.current.takePhoto();
    setPhotoPreview(imageSrc);
    setShowCamera(false);
  }, []);

  const handleFlipCamera = useCallback(() => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  }, []);

  const toggleCamera = useCallback(() => {
    setShowCamera(prev => !prev);
  }, []);

  const toggleFullMap = useCallback(() => {
    setShowFullMap(prev => {
      const newState = !prev;
      if (!newState && map && userProfileData?.location) {
        map.flyTo({
          center: [userProfileData.location.longitude, userProfileData.location.latitude],
          zoom: 15,
          duration: 2000
        });
      }
      return newState;
    });
  }, [map, userProfileData]);

  const toggleImagePreview = useCallback((image) => {
    setSelectedImage(image);
    setShowImagePreview(prev => !prev);
    if (image) {
      fetchComments(image.id);
    }
  }, []);

  const fetchComments = useCallback(async (imageId) => {
    const commentsRef = collection(db, 'photos', imageId, 'comments');
    const commentsSnapshot = await getDocs(commentsRef);
    const fetchedComments = commentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setComments(fetchedComments);
  }, []);

  const handleAddComment = useCallback(async (commentText) => {
    if (commentText.trim() && selectedImage) {
      const commentRef = await addDoc(collection(db, 'photos', selectedImage.id, 'comments'), {
        text: commentText,
        userId: auth.currentUser.uid,
        username: auth.currentUser.displayName,
        timestamp: new Date()
      });
      setComments(prev => [...prev, { id: commentRef.id, text: commentText, userId: auth.currentUser.uid, username: auth.currentUser.displayName, timestamp: new Date() }]);
    }
  }, [selectedImage]);

  const handleDeletePost = useCallback(async () => {
    if (selectedImage && selectedImage.userId === auth.currentUser.uid) {
      await deleteDoc(doc(db, 'photos', selectedImage.id));
      setShowImagePreview(false);
      setGridData(prev => prev.filter(item => item.id !== selectedImage.id));
    }
  }, [selectedImage]);

  const handleUploadPhoto = useCallback(async (cropInfo, size, captionText) => {
    if (auth.currentUser && photoPreview) {
      try {
        const photoRef = doc(collection(db, 'photos'));
        await setDoc(photoRef, {
          userId: auth.currentUser.uid,
          username: auth.currentUser.displayName,
          userProfileImage: currentUser?.profilePhoto || null,
          image: photoPreview,
          size: size,
          caption: captionText,
          cropInfo: cropInfo,
          timestamp: serverTimestamp(),
        }, { merge: true });
        showNotification('Photo uploaded successfully');
        setPhotoPreview(null);
        setCaption('');
        const newPhoto = { 
          id: photoRef.id, 
          userId: auth.currentUser.uid, 
          username: auth.currentUser.displayName,
          userProfileImage: currentUser?.profilePhoto || null,
          image: photoPreview, 
          size: size, 
          caption: captionText,
          cropInfo: cropInfo,
          timestamp: new Date() 
        };
        setGridData(prev => [newPhoto, ...prev]);
      } catch (error) {
        console.error('Error uploading photo:', error);
        showNotification('Failed to upload photo. Please try again.');
      }
    }
  }, [auth.currentUser, photoPreview, currentUser, showNotification]);
  
  const toggleNotifications = useCallback(() => setShowNotifications(prev => !prev), []);
  const clearNotifications = useCallback(() => setNotifications([]), []);

  const ProfileDisplay = useMemo(() => () => (
    <div className="profile-display">
      <div className="profile-photo-container">
        <img 
          src={currentUser?.profilePhoto || '/default-profile-image.jpg'} 
          alt={currentUser?.name || 'Profile'} 
          className="profile-photo" 
        />
      </div>
      <div className="profile-name-status">
        <h2 className="profile-name">{currentUser?.name || 'Loading...'}</h2>
        <p className="profile-status">
          <span className="status-dot"></span>
          Active now
        </p>
      </div>
    </div>
  ), [currentUser]);

  const Card = React.memo(({ size, user, image, caption, onClick }) => {
    const truncateCaption = (text, maxLength = 50) => {
      if (text.length <= maxLength) return text;
      return text.substr(0, maxLength - 3) + '...';
    };
  
    return (
      <div className="card-wrapper">
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
          className={`card ${size}`}
          onClick={onClick}
        >
          <img src={image} alt={`Photo by ${user.name}`} className="card-image" />
          {caption && (
            <div className="card-caption">
              {truncateCaption(caption)}
            </div>
          )}
        </motion.div>
        <div className="card-user-info">
          <img src={user.profilePhoto || '/default-profile-image.jpg'} alt={user.name} className="card-user-avatar" />
          <span className="card-username">{user.name}</span>
        </div>
      </div>
    );
  });

  const ImagePreview = React.memo(({ selectedImage, comments, onClose, onAddComment, onDeletePost }) => {
    const [localComment, setLocalComment] = useState('');

    const handleAddComment = () => {
      onAddComment(localComment);
      setLocalComment('');
    };

    return (
      <div className="image-preview-overlay" onClick={onClose}>
        <div className="image-preview-content" onClick={e => e.stopPropagation()}>
          <div className="image-preview-main">
            <img src={selectedImage?.image} alt="Preview" className="preview-image" />
          </div>
          <div className="image-preview-sidebar">
            <div className="image-preview-header">
              <div className="user-info">
                <img src={selectedImage?.userProfileImage || '/default-profile-image.jpg'} alt="User" className="user-avatar" />
                <span className="username">@{selectedImage?.username}</span>
              </div>
              <IconButton onClick={onClose} className="close-button">
                <Close />
              </IconButton>
            </div>
            <div className="quest-info">
              {selectedImage?.questTitle ? (
                <p className="quest-title">{selectedImage.questTitle}</p>
              ) : (
                <p className="quest-break">Taking a break from quests</p>
              )}
            </div>
            {selectedImage?.caption && (
              <p className="image-caption">{selectedImage.caption}</p>
            )}
            <div className="comments-section">
              {comments.map(comment => (
                <div key={comment.id} className="comment">
                  <strong>{comment.username}: </strong>{comment.text}
                </div>
              ))}
            </div>
            <div className="add-comment">
              <TextField
                value={localComment}
                onChange={(e) => setLocalComment(e.target.value)}
                placeholder="Add a comment..."
                fullWidth
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={handleAddComment}>
                      <Send />
                    </IconButton>
                  ),
                }}
              />
            </div>
            {selectedImage?.userId === auth.currentUser.uid && (
              <Button
                startIcon={<Delete />}
                onClick={onDeletePost}
                className="delete-button"
              >
                Delete Post
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  });

  const PinterestLayout = React.memo(() => {
    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        setIsLoading(false);
        if (user) {
          fetchGridData();
        } else {
          setGridData([]);
        }
      });

      return () => unsubscribe();
    }, [friendsList]);

    const fetchGridData = useCallback(async () => {
      if (auth.currentUser) {
        const photosRef = collection(db, 'photos');
        const q = query(photosRef, where('userId', 'in', [auth.currentUser.uid, ...friendsList]));
        const photosSnapshot = await getDocs(q);
        const photos = await Promise.all(photosSnapshot.docs.map(async doc => {
          const photoData = doc.data();
          const userData = await fetchUserDataCallback(photoData.userId);
          return { 
            id: doc.id, 
            ...photoData, 
            user: {
              name: userData.name,
              profilePhoto: userData.profilePhoto
            }
          };
        }));
        setGridData(photos);
      }
    }, [friendsList, fetchUserDataCallback]);

    if (isLoading) {
      return <div>Loading...</div>;
    }

    return (
      <div className="pin-container">
        {gridData.map((item) => (
          <Card 
            key={item.id}
            size={item.size} 
            user={item.user}
            image={item.image} 
            caption={item.caption}
            onClick={() => toggleImagePreview(item)} 
          />
        ))}
      </div>
    );
  });

  const renderHomeContent = useCallback(() => (
    <div className="home-content">
      <div className="top-bar">
        <ProfileDisplay />
        <div className="top-bar-center">
          <TextField
            className="search-bar-home"
            placeholder="Search..."
            variant="outlined"
            InputProps={{
              startAdornment: (
                <IconButton>
                  <Search />
                </IconButton>
              ),
            }}
          />
        </div>
        <div className="top-bar-right">
          <IconButton onClick={toggleNotifications}>
            <Badge badgeContent={notifications.length} color="primary">
              <Notifications />
            </Badge>
          </IconButton>
        </div>
      </div>

      {showNotifications && (
        <div className="notifications-dropdown">
          <h3>Notifications</h3>
          {notifications.map((notification, index) => (
            <div key={index} className="notification-item">{notification}</div>
          ))}
          <Button onClick={clearNotifications}>Clear All</Button>
        </div>
      )}

      <div className="main-area">
        <div className="grid-area">
          <PinterestLayout />
        </div>
        <div className="side-area">
          <div className="camera-map-area">
            {showCamera ? (
              <div className="camera-container">
                <Camera
                  ref={cameraRef}
                  facingMode={facingMode}
                  aspectRatio="cover"
                  errorMessages={{}}
                />
                <div className="camera-controls">
                  <IconButton onClick={toggleCamera} className="back-button">
                    <ArrowBack />
                  </IconButton>
                  <IconButton onClick={handleCapture} className="capture-button">
                    <div className="capture-button-inner" />
                  </IconButton>
                  <IconButton onClick={handleFlipCamera} className="flip-button">
                    <Refresh />
                  </IconButton>
                </div>
              </div>
            ) : (
              <div className="camera-placeholder" onClick={toggleCamera}>
                <CameraAlt />
                <span>Open Camera</span>
              </div>
            )}
            <div className="mini-map" onClick={toggleFullMap}>
              <MapComponent 
                address={address} 
                setAddress={setAddress} 
                setCurrentUserIds={setCurrentUserIds}
                setMap={setMap}
                activeSection={activeSection}
                lockedUser={lockedUser}
                showAddressBar={false}
                isFullScreen={false}
              />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showImagePreview && (
          <ImagePreview 
            selectedImage={selectedImage}
            comments={comments}
            onClose={() => setShowImagePreview(false)}
            onAddComment={handleAddComment}
            onDeletePost={handleDeletePost}
          />
        )}
        {photoPreview && (
          <PhotoUploadPreview
            photoPreview={photoPreview}
            initialPhotoSize={photoSize}
            initialCaption={caption}
            onUpload={handleUploadPhoto}
            onCancel={() => setPhotoPreview(null)}
            currentUser={currentUser}
          />
        )}
      </AnimatePresence>
    </div>
  ), [showCamera, facingMode, toggleCamera, handleCapture, handleFlipCamera, toggleFullMap, address, activeSection, lockedUser, showImagePreview, selectedImage, comments, handleAddComment, handleDeletePost, photoPreview, photoSize, caption, handleUploadPhoto, currentUser, notifications, toggleNotifications, clearNotifications]);

  const renderFullMap = useCallback(() => (
    <div className="full-map-container">
      <IconButton onClick={toggleFullMap} className="back-button">
        <ArrowBack />
      </IconButton>
      <MapComponent 
        address={address} 
        setAddress={setAddress} 
        setCurrentUserIds={setCurrentUserIds}
        setMap={setMap}
        activeSection={activeSection}
        lockedUser={lockedUser}
        showAddressBar={true}
        isFullScreen={true}
      />
    </div>
  ), [toggleFullMap, address, activeSection, lockedUser]);

  const handleLogoutClick = useCallback(async () => {
    try {
      await handleLogout();
      showNotification('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      showNotification('Logout failed. Please try again.');
    }
  }, [showNotification, navigate]);

  const renderSection = useCallback(() => {
    switch(activeSection) {
      case 'profile':
        return <UserProfile handleLogout={handleLogoutClick} />;
      case 'quests':
        return <QuestsComponent currentUserIds={currentUserIds} map={map} />;
      case 'connections':
        return <Connections 
          currentUserIds={currentUserIds}
          map={map}
          setLockedUser={handleSetLockedUser}
          lockedUser={lockedUser}
          lockedUserData={lockedUserData}
        />;
      case 'history':
        return <HistorySection currentUser={auth.currentUser} />;
      case 'privacy':
        return <PrivacySection />;
      default:
        return renderHomeContent();
    }
  }, [activeSection, currentUserIds, map, handleSetLockedUser, lockedUser, lockedUserData, auth.currentUser, renderHomeContent, handleLogoutClick]);

  const getActiveClass = useCallback(() => {
    if (activeSection === '') {
      return 'home-active';
    }
    if (activeSection === 'profile' || activeSection === 'privacy') {
      return `${activeSection}-active`;
    }
    if (activeSection === 'connections') {
      return lockedUser ? 'connections-locked-active' : 'connections-active';
    }
    return activeSection ? `${activeSection}-active` : '';
  }, [activeSection, lockedUser]);

  return (
    <div className="home-screen-container2">
      <NavigationBar 
        activeSection={activeSection} 
        showSection={showSection} 
      />
      <div className={`main-content2 ${getActiveClass()}`}>
        {showFullMap ? renderFullMap() : renderSection()}
        {activeSection !== '' && !showFullMap && (
          <div className="map-container2">
            <MapComponent 
              address={address} 
              setAddress={setAddress} 
              setCurrentUserIds={setCurrentUserIds}
              setMap={setMap}
              activeSection={activeSection}
              lockedUser={lockedUser}
              showAddressBar={true}
              isFullScreen={false}
            />
          </div>
        )}
      </div>
    </div>
  );
});

export default HomeScreen;