import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, fetchUserData } from '../firebase';
import '../styles/mapstyles.css';
import '../styles/HomeScreen.css';
import '../styles/profile.css';
import MapComponent from './MapComponent';
import UserProfile from './UserProfile';
import QuestsComponent from './QuestsComponent';
import Connections from './Connections';
import HistorySection from './HistorySection';
import PrivacySection from './PrivacySection';
import NavigationBar from './NavigationBar';
import { useNotification } from '../NotificationContext';
import { checkAuthStatus, handleLogout } from './UserAuthService';
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc, addDoc } from 'firebase/firestore';
import { Camera } from 'react-camera-pro';
import { IconButton, TextField, Button, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { ArrowBack, CameraAlt, Refresh, Person, Close, Search, Delete, Send } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const HomeScreen = () => {
  const [activeSection, setActiveSection] = useState('');
  const [currentUserIds, setCurrentUserIds] = useState([]);
  const [address, setAddress] = useState('Loading address...');
  const [map, setMap] = useState(null);
  const [lockedUser, setLockedUser] = useState(null);
  const [lockedUserData, setLockedUserData] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [flash, setFlash] = useState(false);
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
  const cameraRef = useRef(null);

  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userData = await fetchUserData(user.uid);
        if (userData) {
          setCurrentUser({ uid: user.uid, ...userData });
        } else {
          console.error("User document not found");
        }
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const unsubscribeAuth = checkAuthStatus(navigate);
    return () => unsubscribeAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (auth.currentUser) {
        const userData = await fetchUserData(auth.currentUser.uid);
        if (userData) {
          setUserProfileData(userData);
        }
      }
    };
    fetchUserProfile();
  }, []);

  useEffect(() => {
    const fetchFriends = async () => {
      if (auth.currentUser) {
        const friendsRef = collection(db, 'users', auth.currentUser.uid, 'friends');
        const friendsSnapshot = await getDocs(friendsRef);
        const friendIds = friendsSnapshot.docs.map(doc => doc.id);
        setFriendsList(friendIds);
      }
    };
    fetchFriends();
  }, []);

  const showSection = useCallback((sectionId) => {
    setActiveSection(sectionId === activeSection ? '' : sectionId);
    setShowFullMap(false);
  }, [activeSection]);

  const handleSetLockedUser = useCallback(async (userId) => {
    console.log("Setting locked user:", userId);
    if (userId) {
      try {
        const userData = await fetchUserData(userId);
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
        const currentUserData = await fetchUserData(auth.currentUser.uid);
        map.flyTo({
          center: [currentUserData.location.longitude, currentUserData.location.latitude],
          zoom: 15
        });
      }
    }
  }, [map]);

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
    console.log("Image clicked:", image);
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

  const handleAddComment = useCallback(async () => {
    if (newComment.trim() && selectedImage) {
      const commentRef = await addDoc(collection(db, 'photos', selectedImage.id, 'comments'), {
        text: newComment,
        userId: auth.currentUser.uid,
        username: auth.currentUser.displayName,
        timestamp: new Date()
      });
      setComments(prev => [...prev, { id: commentRef.id, text: newComment, userId: auth.currentUser.uid, username: auth.currentUser.displayName, timestamp: new Date() }]);
      setNewComment('');
    }
  }, [newComment, selectedImage]);

  const handleDeletePost = useCallback(async () => {
    if (selectedImage && selectedImage.userId === auth.currentUser.uid) {
      await deleteDoc(doc(db, 'photos', selectedImage.id));
      setShowImagePreview(false);
      setGridData(prev => prev.filter(item => item.id !== selectedImage.id));
    }
  }, [selectedImage]);

  const handleUploadPhoto = useCallback(async () => {
    if (auth.currentUser && photoPreview) {
      try {
        const photoRef = doc(collection(db, 'photos'));
        await setDoc(photoRef, {
          userId: auth.currentUser.uid,
          username: auth.currentUser.displayName,
          userProfileImage: currentUser?.profilePhoto || null,
          image: photoPreview,
          size: photoSize,
          caption: caption,
          timestamp: new Date(),
        });
        showNotification('Photo uploaded successfully');
        setPhotoPreview(null);
        setCaption('');
        const newPhoto = { 
          id: photoRef.id, 
          userId: auth.currentUser.uid, 
          username: auth.currentUser.displayName,
          userProfileImage: currentUser?.profilePhoto || null,
          image: photoPreview, 
          size: photoSize, 
          caption: caption, 
          timestamp: new Date() 
        };
        setGridData(prev => [newPhoto, ...prev]);
      } catch (error) {
        console.error('Error uploading photo:', error);
        showNotification('Failed to upload photo. Please try again.');
      }
    }
  }, [auth.currentUser, photoPreview, photoSize, caption, currentUser, showNotification]);

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
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="image-preview-overlay"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="image-preview-content"
              onClick={e => e.stopPropagation()}
            >
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
                      style: { color: 'white' }
                    }}
                  />
                  <IconButton onClick={handleAddComment}>
                    <Send />
                  </IconButton>
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  });

  const PhotoUploadPreview = React.memo(({ photoPreview, photoSize, setPhotoSize, initialCaption, setFinalCaption, onUpload, onCancel, currentUser }) => {
    const [localCaption, setLocalCaption] = useState(initialCaption);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const imageRef = useRef(null);
    const containerRef = useRef(null);
  
    useEffect(() => {
      if (imageRef.current && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const imgRect = imageRef.current.getBoundingClientRect();
        setCrop({
          x: (imgRect.width - containerRect.width) / 2,
          y: (imgRect.height - containerRect.height) / 2
        });
      }
    }, [photoSize]);
  
    const handleCardMove = (e) => {
      if (containerRef.current && imageRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const imgRect = imageRef.current.getBoundingClientRect();
        
        const newX = crop.x - e.movementX;
        const newY = crop.y - e.movementY;
        
        const maxX = imgRect.width - rect.width;
        const maxY = imgRect.height - rect.height;
        
        setCrop({
          x: Math.max(0, Math.min(maxX, newX)),
          y: Math.max(0, Math.min(maxY, newY))
        });
      }
    };
  
    const getSizeStyle = () => {
      switch (photoSize) {
        case 'small': return { width: '200px', height: '200px' };
        case 'medium': return { width: '300px', height: '300px' };
        case 'large': return { width: '400px', height: '400px' };
        default: return { width: '300px', height: '300px' };
      }
    };
  
    const handleUpload = () => {
      setFinalCaption(localCaption);
      onUpload();
    };
  
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="photo-upload-preview-overlay"
      >
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="photo-upload-preview-container"
        >
          <div className="preview-content">
            <div className="full-image-container">
              <img 
                ref={imageRef}
                src={photoPreview} 
                alt="Full Preview" 
                className="full-preview-image"
                style={{
                  transform: `translate(${-crop.x}px, ${-crop.y}px)`,
                  cursor: 'move'
                }}
                onMouseDown={(e) => {
                  const startX = e.clientX;
                  const startY = e.clientY;
                  const handleMouseMove = (e) => {
                    handleCardMove({
                      movementX: startX - e.clientX,
                      movementY: startY - e.clientY
                    });
                  };
                  const handleMouseUp = () => {
                    window.removeEventListener('mousemove', handleMouseMove);
                    window.removeEventListener('mouseup', handleMouseUp);
                  };
                  window.addEventListener('mousemove', handleMouseMove);
                  window.addEventListener('mouseup', handleMouseUp);
                }}
              />
              <div 
                ref={containerRef}
                className="card-outline"
                style={getSizeStyle()}
              >
                <div className="card-outline-border" />
              </div>
            </div>
            <div className="preview-controls">
              <RadioGroup
                row
                aria-label="photo-size"
                name="photo-size"
                value={photoSize}
                onChange={(e) => setPhotoSize(e.target.value)}
                className="size-select"
              >
                <FormControlLabel value="small" control={<Radio />} label="Small" />
                <FormControlLabel value="medium" control={<Radio />} label="Medium" />
                <FormControlLabel value="large" control={<Radio />} label="Large" />
              </RadioGroup>
              <TextField
                value={localCaption}
                onChange={(e) => setLocalCaption(e.target.value)}
                placeholder="Add a caption..."
                fullWidth
                margin="normal"
                InputProps={{
                  style: { 
                    color: 'white', 
                    fontWeight: 'bold',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '10px'
                  }
                }}
              />
              <div className="button-group">
                <Button onClick={handleUpload} variant="contained" color="primary">
                  Upload
                </Button>
                <Button onClick={onCancel} variant="outlined">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
          <div className="preview-user-info">
            <img 
              src={currentUser?.profilePhoto || '/default-profile-image.jpg'} 
              alt={currentUser?.name || 'User'} 
              className="preview-user-avatar"
            />
            <span className="preview-username">{currentUser?.name || 'User'}</span>
          </div>
        </motion.div>
      </motion.div>
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
          const userData = await fetchUserData(photoData.userId);
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
    }, [friendsList]);

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
            photoSize={photoSize}
            setPhotoSize={setPhotoSize}
            initialCaption={caption}
            setFinalCaption={setCaption}
            onUpload={handleUploadPhoto}
            onCancel={() => setPhotoPreview(null)}
            currentUser={currentUser}
          />
        )}
      </AnimatePresence>
    </div>
  ), [showCamera, facingMode, toggleCamera, handleCapture, handleFlipCamera, toggleFullMap, address, activeSection, lockedUser, showImagePreview, selectedImage, comments, handleAddComment, handleDeletePost, photoPreview, photoSize, caption, handleUploadPhoto, currentUser]);

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
};

export default HomeScreen;