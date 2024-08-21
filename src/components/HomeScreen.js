import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
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
import { IconButton, TextField, Button } from '@mui/material';
import { ArrowBack, CameraAlt, Refresh, Person, Close, Search, Delete, Send } from '@mui/icons-material';

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
  const cameraRef = useRef(null);

  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    const unsubscribeAuth = checkAuthStatus(navigate);
    return () => unsubscribeAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserProfileData(userDoc.data());
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

  const showSection = (sectionId) => {
    setActiveSection(sectionId === activeSection ? '' : sectionId);
    setShowFullMap(false);
  };

  const handleSetLockedUser = useCallback(async (userId) => {
    console.log("Setting locked user:", userId);
    if (userId) {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
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
        const currentUserDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const currentUserData = currentUserDoc.data();
        map.flyTo({
          center: [currentUserData.location.longitude, currentUserData.location.latitude],
          zoom: 15
        });
      }
    }
  }, [map]);

  const handleCapture = () => {
    const imageSrc = cameraRef.current.takePhoto();
    setPhotoPreview(imageSrc);
    setShowCamera(false);
  };

  const handleFlipCamera = () => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  };

  const toggleCamera = () => {
    setShowCamera(!showCamera);
  };

  const toggleFullMap = () => {
    setShowFullMap(!showFullMap);
    if (!showFullMap && map && userProfileData?.location) {
      map.flyTo({
        center: [userProfileData.location.longitude, userProfileData.location.latitude],
        zoom: 15,
        duration: 2000
      });
    }
  };

  const toggleImagePreview = (image) => {
    console.log("Image clicked:", image);
    setSelectedImage(image);
    setShowImagePreview(!showImagePreview);
    if (image) {
      fetchComments(image.id);
    }
  };

  const fetchComments = async (imageId) => {
    const commentsRef = collection(db, 'photos', imageId, 'comments');
    const commentsSnapshot = await getDocs(commentsRef);
    const fetchedComments = commentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setComments(fetchedComments);
  };

  const handleAddComment = async () => {
    if (newComment.trim() && selectedImage) {
      const commentRef = await addDoc(collection(db, 'photos', selectedImage.id, 'comments'), {
        text: newComment,
        userId: auth.currentUser.uid,
        username: auth.currentUser.displayName,
        timestamp: new Date()
      });
      setComments([...comments, { id: commentRef.id, text: newComment, userId: auth.currentUser.uid, username: auth.currentUser.displayName, timestamp: new Date() }]);
      setNewComment('');
    }
  };

  const handleDeletePost = async () => {
    if (selectedImage && selectedImage.userId === auth.currentUser.uid) {
      await deleteDoc(doc(db, 'photos', selectedImage.id));
      setShowImagePreview(false);
      // Refresh the grid data
      const updatedGridData = gridData.filter(item => item.id !== selectedImage.id);
      setGridData(updatedGridData);
    }
  };

  const handleUploadPhoto = async () => {
    if (auth.currentUser && photoPreview) {
      try {
        const photoRef = doc(collection(db, 'photos'));
        await setDoc(photoRef, {
          userId: auth.currentUser.uid,
          username: auth.currentUser.displayName,
          image: photoPreview,
          size: photoSize,
          caption: caption,
          timestamp: new Date(),
        });
        showNotification('Photo uploaded successfully');
        setPhotoPreview(null);
        setCaption('');
        // Refresh the grid data
        const newPhoto = { id: photoRef.id, userId: auth.currentUser.uid, username: auth.currentUser.displayName, image: photoPreview, size: photoSize, caption: caption, timestamp: new Date() };
        setGridData([newPhoto, ...gridData]);
      } catch (error) {
        console.error('Error uploading photo:', error);
        showNotification('Failed to upload photo. Please try again.');
      }
    }
  };

  const ProfileDisplay = () => (
    <div className="profile-display">
      <div className="profile-photo-container">
        <img src={userProfileData?.profileImage || 'default-profile-image.jpg'} alt="Profile" className="profile-photo" />
      </div>
      <div className="profile-name-status">
        <h2 className="profile-name">{userProfileData?.name || 'User Name'}</h2>
        <p className="profile-status">
          <span className="status-dot"></span>
          Active now
        </p>
      </div>
    </div>
  );

  const ImagePreview = () => (
    <div className="image-preview-overlay">
      <div className="image-preview-content">
        <div className="image-preview-main">
          <img src={selectedImage?.image} alt="Preview" className="preview-image" />
        </div>
        <div className="image-preview-sidebar">
          <div className="image-preview-header">
            <div className="user-info">
              <img src={selectedImage?.userProfileImage || 'default-profile-image.jpg'} alt="User" className="user-avatar" />
              <span className="username">{selectedImage?.username}</span>
            </div>
            <IconButton onClick={() => toggleImagePreview(null)} className="close-button">
              <Close />
            </IconButton>
          </div>
          <p className="image-caption">{selectedImage?.caption}</p>
          <div className="comments-section">
            {comments.map(comment => (
              <div key={comment.id} className="comment">
                <strong>{comment.username}: </strong>{comment.text}
              </div>
            ))}
          </div>
          <div className="add-comment">
            <TextField
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              fullWidth
            />
            <IconButton onClick={handleAddComment}>
              <Send />
            </IconButton>
          </div>
        </div>
      </div>
      <div className="related-images">
        {/* Add logic to display related images here */}
      </div>
    </div>
  );

  const PinterestLayout = () => {
    useEffect(() => {
      const fetchGridData = async () => {
        const photosRef = collection(db, 'photos');
        const q = query(photosRef, where('userId', 'in', [auth.currentUser.uid, ...friendsList]));
        const photosSnapshot = await getDocs(q);
        const photos = photosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGridData(photos);
      };
      fetchGridData();
    }, [friendsList]);

    return (
      <div className="pin-container">
        {gridData.map((item, index) => (
          <Card key={index} size={item.size} user={item.username} image={item.image} onClick={() => toggleImagePreview(item)} />
        ))}
      </div>
    );
  };

  const Card = ({ size, user, image, onClick }) => {
    return (
      <div className={`card ${size}`} onClick={onClick}>
        <img src={image} alt={`Photo by ${user}`} className="card-image" />
        <div className="user-info">
          <div className="avatar"></div>
          <span className="username">@{user}</span>
        </div>
      </div>
    );
  };

  const renderHomeContent = () => (
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

      {showImagePreview && <ImagePreview />}
      {photoPreview && (
        <div className="photo-preview-overlay">
          <div className="photo-preview-container">
            <img src={photoPreview} alt="Captured" className="photo-preview" />
            <div className="photo-preview-controls">
              <select value={photoSize} onChange={(e) => setPhotoSize(e.target.value)}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
              <TextField
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                fullWidth
                margin="normal"
              />
              <Button onClick={handleUploadPhoto} variant="contained" color="primary">Upload</Button>
              <Button onClick={() => setPhotoPreview(null)} variant="outlined">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFullMap = () => (
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
  );

  const renderSection = () => {
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
  };

  const handleLogoutClick = async () => {
    try {
      await handleLogout();
      showNotification('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      showNotification('Logout failed. Please try again.');
    }
  };

  const getActiveClass = () => {
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
  };

  return (
    <div className="home-screen-container">
      <NavigationBar 
        activeSection={activeSection} 
        showSection={showSection} 
      />
      <div className={`main-content ${getActiveClass()}`}>
        {showFullMap ? renderFullMap() : renderSection()}
        {activeSection !== '' && !showFullMap && (
          <div className="map-container">
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