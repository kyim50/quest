import React, { useState, useRef } from 'react';
import { Camera } from 'react-camera-pro';
import { IconButton } from '@mui/material';
import { FlashOn, CameraAlt, Refresh, Person, ChatBubbleOutline } from '@mui/icons-material';

const LocketPinterestHybrid = ({ currentUser }) => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [facingMode, setFacingMode] = useState('environment');
  const [flash, setFlash] = useState(false);
  const [showCamera, setShowCamera] = useState(true);
  const cameraRef = useRef(null);

  const handleCapture = () => {
    const imageSrc = cameraRef.current.takePhoto();
    setCapturedImage(imageSrc);
    setShowCamera(false);
  };

  const handleFlipCamera = () => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  };

  const handleFlash = () => {
    setFlash(!flash);
  };

  const toggleView = () => {
    setShowCamera(!showCamera);
  };

  const PinterestLayout = () => {
    const dummyData = [
      { size: 'small', user: 'User1' },
      { size: 'medium', user: 'User2' },
      { size: 'large', user: 'User3' },
      { size: 'small', user: 'User4' },
      { size: 'medium', user: 'User5' },
      { size: 'large', user: 'User6' },
    ];

    return (
      <div style={styles.pin_container}>
        {dummyData.map((item, index) => (
          <Card key={index} size={item.size} user={item.user} />
        ))}
      </div>
    );
  };

  const Card = ({ size, user }) => {
    return (
      <div style={{
        ...styles.card,
        ...styles[size]
      }}>
        <div style={styles.userInfo}>
          <div style={styles.avatar}></div>
          <span style={styles.username}>@{user}</span>
        </div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <IconButton style={styles.iconButton}>
          <Person />
        </IconButton>
        <button style={styles.friendsButton}>
          {showCamera ? '25 Friends' : 'Create'}
        </button>
        <IconButton style={styles.iconButton}>
          <ChatBubbleOutline />
        </IconButton>
      </div>

      {showCamera ? (
        <div style={styles.cameraContainer}>
          <Camera
            ref={cameraRef}
            facingMode={facingMode}
            aspectRatio="cover"
            errorMessages={{}}
          />
          <div style={styles.cameraControls}>
            <IconButton onClick={handleFlash} style={styles.controlButton}>
              <FlashOn />
            </IconButton>
            <IconButton onClick={handleCapture} style={styles.captureButton}>
              <CameraAlt />
            </IconButton>
            <IconButton onClick={handleFlipCamera} style={styles.controlButton}>
              <Refresh />
            </IconButton>
          </div>
        </div>
      ) : (
        <PinterestLayout />
      )}

      <div style={styles.bottomBar}>
        <div style={styles.historyButton} onClick={toggleView}>
          <span style={styles.icon}>🖼️</span>
          <span style={styles.text}>{showCamera ? 'History' : 'Camera'}</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#121212',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
  },
  iconButton: {
    backgroundColor: '#333333',
    color: '#ffffff',
    borderRadius: '50%',
    padding: '10px',
  },
  friendsButton: {
    backgroundColor: '#333333',
    color: '#ffffff',
    border: 'none',
    borderRadius: '20px',
    padding: '10px 20px',
    fontSize: '16px',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '20px',
    margin: '20px',
  },
  cameraControls: {
    position: 'absolute',
    bottom: '20px',
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: '#ffffff',
    borderRadius: '50%',
    padding: '10px',
  },
  captureButton: {
    backgroundColor: '#ffffff',
    color: '#000000',
    border: '3px solid #ffd700',
    borderRadius: '50%',
    padding: '20px',
  },
  bottomBar: {
    display: 'flex',
    justifyContent: 'center',
    padding: '20px',
  },
  historyButton: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#333333',
    borderRadius: '20px',
    padding: '10px 20px',
    cursor: 'pointer',
  },
  icon: {
    marginRight: '10px',
  },
  text: {
    fontSize: '16px',
  },
  pin_container: {
    margin: 0,
    padding: 0,
    width: '80vw',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, 250px)',
    gridAutoRows: '10px',
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    justifyContent: 'center',
    backgroundColor: '#121212',
  },
  card: {
    margin: '15px 10px',
    padding: 0,
    borderRadius: '16px',
    backgroundColor: '#333333',
    position: 'relative',
  },
  small: {
    gridRowEnd: 'span 26',
  },
  medium: {
    gridRowEnd: 'span 33',
  },
  large: {
    gridRowEnd: 'span 45',
  },
  userInfo: {
    position: 'absolute',
    bottom: '10px',
    left: '10px',
    display: 'flex',
    alignItems: 'center',
  },
  avatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    marginRight: '5px',
  },
  username: {
    fontSize: '12px',
    color: '#ffffff',
  },
};

export default LocketPinterestHybrid;