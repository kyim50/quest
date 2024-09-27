import React, { useState, useCallback, useRef } from 'react';
import { IconButton, TextField, Button } from '@mui/material';
import { Camera } from 'react-camera-pro';
import { ArrowBack, Refresh, Check } from '@mui/icons-material';
import { useUser } from './UserProvider';
import { useNavigate } from 'react-router-dom';
import { storage, db, auth } from '../firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { addDoc, collection } from 'firebase/firestore';
import '../styles/CameraOverlay.css';

const CameraOverlay = () => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [facingMode, setFacingMode] = useState('environment');
  const currentUser = useUser();
  const navigate = useNavigate();
  const cameraRef = useRef(null);

  const handleCapture = useCallback(() => {
    if (cameraRef.current) {
      const imageSrc = cameraRef.current.takePhoto();
      setCapturedImage(imageSrc);
    }
  }, []);

  const handleAspectRatioChange = (ratio) => {
    setSelectedAspectRatio(ratio);
  };

  const handleConfirm = async () => {
    setIsUploading(true);
    try {
      const storageRef = ref(storage, `quest_images/${Date.now()}_${auth.currentUser.uid}.jpg`);
      await uploadString(storageRef, capturedImage, 'data_url');
      const imageUrl = await getDownloadURL(storageRef);

      const questData = {
        imageUrl,
        aspectRatio: selectedAspectRatio,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }),
        user: currentUser?.name || 'Anonymous',
        description,
        createdAt: new Date().toISOString(),
        userId: auth.currentUser.uid
      };

      await addDoc(collection(db, 'quests'), questData);
      console.log('Quest uploaded successfully');
      navigate('/home/*');
    } catch (error) {
      console.error('Error uploading quest:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleBack = () => {
    if (capturedImage) {
      setCapturedImage(null);
    } else {
      navigate('/home/*');
    }
  };

  const toggleCamera = () => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="camera-overlay fullscreen">
      {!capturedImage ? (
        <>
          <Camera
            ref={cameraRef}
            facingMode={facingMode}
            aspectRatio="cover"
            errorMessages={{}}
            videoSourceDeviceId={undefined}
            numberOfCamerasCallback={(i) => console.log(i)}
            videoResolution="highest"
          />
          <div className="camera-controls">
            <IconButton onClick={handleBack} className="back-button">
              <ArrowBack />
            </IconButton>
            <IconButton onClick={handleCapture} className="capture-button">
              <div className="capture-button-inner" />
            </IconButton>
            <IconButton onClick={toggleCamera} className="flip-button">
              <Refresh />
            </IconButton>
          </div>
        </>
      ) : (
        <div className="image-preview-overlay">
          <img src={capturedImage} alt="Captured" className="captured-image" style={{ aspectRatio: selectedAspectRatio }} />
          <div className="controls-container">
            <div className="aspect-ratio-selector">
              {['1:1', '4:5', '16:9'].map((ratio) => (
                <Button
                  key={ratio}
                  variant={selectedAspectRatio === ratio ? "contained" : "outlined"}
                  onClick={() => handleAspectRatioChange(ratio)}
                  className="aspect-ratio-button"
                >
                  {ratio}
                </Button>
              ))}
            </div>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Add a description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="description-input"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleConfirm}
              disabled={isUploading}
              className="confirm-button"
              startIcon={<Check />}
            >
              Confirm
            </Button>
          </div>
          <IconButton onClick={handleBack} className="back-button">
            <ArrowBack />
          </IconButton>
        </div>
      )}
    </div>
  );
};

export default CameraOverlay;