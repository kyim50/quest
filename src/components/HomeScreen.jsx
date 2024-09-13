import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconButton, TextField, Button, Badge, Radio, RadioGroup, FormControlLabel } from '@mui/material';
import { Search, Notifications, ArrowBack, CameraAlt, Refresh, Close, Delete, Send } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db, fetchUserData } from '../firebase';
import { collection, getDocs, getDoc, addDoc, updateDoc, deleteDoc, setDoc, doc, serverTimestamp, query, where, orderBy, limit } from 'firebase/firestore';
import { Camera } from 'react-camera-pro';
import { useNotification } from '../NotificationContext';
import { checkAuthStatus, handleLogout } from './UserAuthService';
import MapComponent from './MapComponent';
import NavigationBar from './NavigationBar';
import UserProfile from './UserProfile';
import QuestsComponent from './QuestsComponent';
import Connections from './Connections';
import PrivacySection from './PrivacySection';
import PhotoUploadPreview from './PhotoUploadPreview';
import { toggleTheme } from '../theme-toggle';
import '../styles/HomeScreen.css';
import notificationIcon from '../assets/notification.png';
import themeToggleIcon from '../assets/day-and-night.png';

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
  const [isHomeActive, setIsHomeActive] = useState(true);
  const [cameraResolution, setCameraResolution] = useState({ width: 1920, height: 1080 });
  const [friends, setFriends] = useState([]);
  const [isFullScreenCamera, setIsFullScreenCamera] = useState(false);
  
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
          fetchFriends(user.uid);
          fetchGridData(user.uid);
        } else {
          console.error("User document not found");
        }
      } else {
        setCurrentUser(null);
        setUserProfileData(null);
        setFriends([]);
        setGridData([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribeAuth();
  }, [fetchUserDataCallback]);

  useEffect(() => {
    const unsubscribeAuth = checkAuthStatus(navigate);
    return () => unsubscribeAuth();
  }, [navigate]);

  useEffect(() => {
    const updateCameraResolution = () => {
      const isDesktop = window.innerWidth >= 1024;
      setCameraResolution(isDesktop ? { width: 3840, height: 2160 } : { width: 1920, height: 1080 });
    };

    updateCameraResolution();
    window.addEventListener('resize', updateCameraResolution);
    return () => window.removeEventListener('resize', updateCameraResolution);
  }, []);

  const fetchFriends = useCallback(async (userId) => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const friendIds = userData.friends || [];

      const friendsData = await Promise.all(
        friendIds.map(async (friendId) => {
          const friendRef = doc(db, 'users', friendId);
          const friendSnap = await getDoc(friendRef);
          if (friendSnap.exists()) {
            const friendData = friendSnap.data();
            
            const activeQuestQuery = query(
              collection(db, 'quests'),
              where('uid', '==', friendId),
              where('status', '==', 'accepted')
            );
            const activeQuestSnap = await getDocs(activeQuestQuery);
            
            let questStatus = 'Idle';
            let questPartner = null;
            
            if (!activeQuestSnap.empty) {
              const questData = activeQuestSnap.docs[0].data();
              questStatus = 'On a quest';
              if (questData.targetUser) {
                const partnerSnap = await getDoc(doc(db, 'users', questData.targetUser));
                if (partnerSnap.exists()) {
                  questPartner = partnerSnap.data();
                }
              }
            }

            return {
              id: friendId,
              name: friendData.name,
              username: friendData.username,
              profilePhoto: friendData.profilePhoto,
              status: questStatus,
              questPartner: questPartner
            };
          }
          return null;
        })
      );

      setFriends(friendsData.filter(friend => friend !== null));
    }
  }, []);
  
  const fetchGridData = useCallback(async (userId) => {
    if (!userId) return;
    
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const friendIds = userData.friends || [];
        
        const photosRef = collection(db, 'photos');
        const q = query(
          photosRef,
          where('userId', 'in', [userId, ...friendIds]),
          orderBy('timestamp', 'desc')
        );
        const photosSnapshot = await getDocs(q);
        const photos = await Promise.all(photosSnapshot.docs.map(async doc => {
          const photoData = doc.data();
          const userData = await fetchUserData(photoData.userId);
          return { 
            id: doc.id, 
            ...photoData, 
            username: userData?.name || 'Unknown User',
            user: {
              name: userData?.name || 'Unknown User',
              profilePhoto: userData?.profilePhoto || '/default-profile-image.jpg'
            }
          };
        }));
        setGridData(photos);
      }
    } catch (error) {
      console.error('Error fetching grid data:', error);
      showNotification('Failed to load posts. Please try again.');
    }
  }, [fetchUserData, showNotification]);

  const showSection = useCallback((sectionId) => {
    setActiveSection(prevSection => {
      const newSection = sectionId === prevSection ? '' : sectionId;
      setIsHomeActive(newSection === '' || newSection === 'home');
      setShowFullMap(false);
      return newSection;
    });
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
    if (cameraRef.current) {
      const imageSrc = cameraRef.current.takePhoto();
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);

        const highQualityImageSrc = canvas.toDataURL('image/png', 1);

        setPhotoPreview(highQualityImageSrc);
        setShowCamera(false);
      };
      img.src = imageSrc;
    }
  }, []);

  const handleFlipCamera = useCallback(() => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  }, []);

  const toggleCamera = useCallback(() => {
    setShowCamera(prev => !prev);
    setIsFullScreenCamera(prev => !prev);
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
    const fetchedComments = await Promise.all(commentsSnapshot.docs.map(async doc => {
      const commentData = doc.data();
      const userData = await fetchUserDataCallback(commentData.userId);
      return { 
        id: doc.id, 
        ...commentData,
        userProfileImage: userData.profilePhoto
      };
    }));
    setComments(fetchedComments);
  }, [fetchUserDataCallback]);

  const handleAddComment = useCallback(async (commentText) => {
    if (commentText.trim() && selectedImage) {
      const commentRef = await addDoc(collection(db, 'photos', selectedImage.id, 'comments'), {
        text: commentText,
        userId: auth.currentUser.uid,
        username: auth.currentUser.displayName,
        timestamp: new Date()
      });
      const userData = await fetchUserDataCallback(auth.currentUser.uid);
      setComments(prev => [...prev, { 
        id: commentRef.id, 
        text: commentText, 
        userId: auth.currentUser.uid, 
        username: auth.currentUser.displayName, 
        timestamp: new Date(),
        userProfileImage: userData.profilePhoto
      }]);
    }
  }, [selectedImage, fetchUserDataCallback]);

  const handleUploadPhoto = useCallback(async (cropInfo, aspectRatio, captionText = '') => {
    if (auth.currentUser && photoPreview) {
      try {
        const photoRef = doc(collection(db, 'photos'));
        const newPhoto = { 
          id: photoRef.id, 
          userId: auth.currentUser.uid, 
          user: {
            name: auth.currentUser.displayName || 'Unknown User',
            profilePhoto: currentUser?.profilePhoto || null,
          },
          image: photoPreview, 
          aspectRatio: aspectRatio, 
          caption: captionText,
          cropInfo: cropInfo,
          timestamp: serverTimestamp(),
        };
        
        await setDoc(photoRef, newPhoto);
        
        showNotification('Photo uploaded successfully');
        setPhotoPreview(null);
        setCaption('');
        setGridData(prev => [newPhoto, ...prev]);
        
        // Fetch updated data immediately after upload
        fetchGridData(auth.currentUser.uid);
      } catch (error) {
        console.error('Error uploading photo:', error);
        showNotification('Failed to upload photo. Please try again.');
      }
    }
  }, [auth.currentUser, photoPreview, currentUser, showNotification, fetchGridData]);

  const handleDeletePost = useCallback(async () => {
    if (selectedImage && selectedImage.userId === auth.currentUser.uid) {
      try {
        await deleteDoc(doc(db, 'photos', selectedImage.id));
        setShowImagePreview(false);
        setGridData(prev => prev.filter(item => item.id !== selectedImage.id));
        showNotification('Post deleted successfully');
        
        // Fetch updated data immediately after deletion
        fetchGridData(auth.currentUser.uid);
      } catch (error) {
        console.error('Error deleting post:', error);
        showNotification('Failed to delete post. Please try again.');
      }
    }
  }, [selectedImage, showNotification, fetchGridData]);

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

  const PinterestLayout = React.memo(({ items, onItemClick }) => {
    const getCardSize = (aspectRatio) => {
      const [width, height] = aspectRatio.split(':').map(Number);
      const ratio = height / width;
      if (ratio <= 1) return 26; // Square or landscape
      if (ratio <= 1.5) return 33; // Portrait
      return 45; // Tall portrait
    };
  
    return (
      <div className="pin-container">
        {items.map((item) => {
          const size = getCardSize(item.aspectRatio || '1:1');
          return (
            <div key={item.id} className="card-wrapper" style={{ gridRowEnd: `span ${size}` }}>
              <div className="card" onClick={() => onItemClick(item)}>
                <img src={item.image} alt={item.caption || `Photo by ${item.user.name}`} className="card-image" />
              </div>
              <div className="card-user-info">
                <img src={item.user.profilePhoto || '/default-profile-image.jpg'} alt={item.user.name} className="card-user-avatar" />
                <span className="card-username">— {item.user.name}</span>
              </div>
            </div>
          );
        })}
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
                <img src={selectedImage?.user?.profilePhoto || '/default-profile-image.jpg'} alt="User" className="user-avatar" />
                <span className="username">{selectedImage?.user?.name || 'Unknown User'}</span>
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
                  <img 
                    src={comment.userProfileImage || '/default-profile-image.jpg'} 
                    alt={comment.username} 
                    className="comment-user-avatar"
                  />
                  <div className="comment-content">
                    <strong>{comment.username}</strong>
                    <p>{comment.text}</p>
                  </div>
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
            {selectedImage?.userId === auth.currentUser?.uid && (
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

  const renderHomeContent = useCallback(() => (
    <div className="home-content">
      <div className="top-bar">
        <ProfileDisplay />
        <div className="top-bar-center">
          <TextField
            className="search-bar-home"
            placeholder="Search..."
            variant="outlined"
            fullWidth
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
              <img src={notificationIcon} alt="Notifications" className="top-bar-icon" />
            </Badge>
          </IconButton>
          <IconButton onClick={toggleTheme}>
            <img src={themeToggleIcon} alt="Toggle Theme" className="top-bar-icon" />        
          </IconButton>
        </div>
      </div>

      <div className="section-container">
        <div className="friends-list2">
          {friends.map((friend) => (
            <div key={friend.id} className="friend-item">
              <div className="friend-photo-container">
                <img src={friend.profilePhoto || '/default-profile-image.jpg'} alt={friend.name} className="friend-photo" />
              </div>
              <div className="friend-info">
                <div className="friend-name">{friend.name}</div>
                <div className="friend-username">@{friend.username}</div>
                <div className={`friend-status ${friend.status === 'Idle' ? 'idle' : 'on-quest'}`}>
                  {friend.status}
                  {friend.status === 'On a quest' && friend.questPartner && (
                    <span className="quest-partner">
                      with <img src={friend.questPartner.profilePhoto || '/default-profile-image.jpg'} alt={friend.questPartner.name} className="partner-photo" />
                      @{friend.questPartner.username}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
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
          <div className="section-container">
            <h2 className="section-title3">Feed</h2>
            <PinterestLayout items={gridData} onItemClick={toggleImagePreview} />
          </div>
        </div>
        <div className="side-area">
          <div className="section-container">
            <h2 className="section-title">Camera & Map</h2>
            <div className="camera-map-area">
              {isFullScreenCamera ? (
                <div className="full-screen-camera">
                  <Camera
                    ref={cameraRef}
                    facingMode={facingMode}
                    aspectRatio="cover"
                    errorMessages={{}}
                    videoSourceDeviceId={undefined}
                    numberOfCamerasCallback={(i) => console.log(i)}
                    videoResolution={cameraResolution}
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
            onUpload={handleUploadPhoto}
            onCancel={() => setPhotoPreview(null)}
            currentUser={currentUser}
          />
        )}
      </AnimatePresence>
    </div>
  ), [showCamera, facingMode, toggleCamera, handleCapture, handleFlipCamera, toggleFullMap, address, activeSection, lockedUser, showImagePreview, selectedImage, comments, handleAddComment, handleDeletePost, photoPreview, handleUploadPhoto, currentUser, notifications, toggleNotifications, clearNotifications, cameraResolution, friends, gridData]);

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
    if (isHomeActive) {
      return renderHomeContent();
    }

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
      case 'privacy':
        return <PrivacySection />;
      default:
        return renderHomeContent();
    }
  }, [activeSection, isHomeActive, currentUserIds, map, handleSetLockedUser, lockedUser, lockedUserData, renderHomeContent, handleLogoutClick]);

  const getActiveClass = useCallback(() => {
    if (isHomeActive) {
      return 'home-active';
    }
    if (activeSection === 'profile' || activeSection === 'privacy') {
      return `${activeSection}-active`;
    }
    if (activeSection === 'connections') {
      return lockedUser ? 'connections-locked-active' : 'connections-active';
    }
    return activeSection ? `${activeSection}-active` : '';
  }, [activeSection, lockedUser, isHomeActive]);

  useEffect(() => {
    if (isHomeActive) {
      setMap(null);
    }
  }, [isHomeActive]);

  return (
    <div className="home-screen-container2">
      <NavigationBar 
        activeSection={activeSection} 
        showSection={showSection}
        logo="Questslogo blue.png"
        title="QUESTS"
      />
      {window.innerWidth <= 768 && (
        <nav className="mobile-nav-bar">
          <a href="#home" className={`mobile-nav-button ${activeSection === '' ? 'active' : ''}`} onClick={() => showSection('')}>
            <img src="home.png" alt="Home" />
            <span>Home</span>
          </a>
          <a href="#profile" className={`mobile-nav-button ${activeSection === 'profile' ? 'active' : ''}`} onClick={() => showSection('profile')}>
            <img src="user-avatar.png" alt="Profile" />
            <span>Profile</span>
          </a>
          <a href="#connections" className={`mobile-nav-button ${activeSection === 'connections' ? 'active' : ''}`} onClick={() => showSection('connections')}>
            <img src="happy.png" alt="Connections" />
            <span>Connections</span>
          </a>
          <a href="#quests" className={`mobile-nav-button ${activeSection === 'quests' ? 'active' : ''}`} onClick={() => showSection('quests')}>
            <img src="letter.png" alt="Quests" />
            <span>Quests</span>
          </a>
          <a href="#privacy" className={`mobile-nav-button ${activeSection === 'privacy' ? 'active' : ''}`} onClick={() => showSection('privacy')}>
            <img src="privacy1.png" alt="Privacy" />
            <span>Privacy</span>
          </a>
        </nav>
      )}
      <div className={`main-content2 ${getActiveClass()}`}>
        {showFullMap ? renderFullMap() : renderSection()}
        {!isHomeActive && !showFullMap && (
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