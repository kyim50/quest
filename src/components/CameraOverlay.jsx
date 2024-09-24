import React, { useState } from 'react';
import CameraComponent from './CameraComponent';
import { IconButton, TextField, CircularProgress } from '@mui/material';
import { ArrowBack, Check } from '@mui/icons-material';
import { useUser } from './UserProvider';
import { useNavigate } from 'react-router-dom';
import { storage, db, auth } from '../firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { addDoc, collection } from '../firebase';
import '../styles/CameraOverlay.css'; // Import the CSS file for styling

const CameraOverlay = ({ onClose }) => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const currentUser = useUser();
  const [time, setTime] = useState('');
  const navigate = useNavigate();

  const handleCapture = (imageSrc) => {
    setCapturedImage(imageSrc);
    setTime(new Date().toLocaleTimeString());
  };

  const handleAspectRatioChange = (ratio) => {
    setSelectedAspectRatio(ratio);
  };

  const handleConfirm = async () => {
    setIsUploading(true);
    try {
      // Upload image to Firebase Storage
      const storageRef = ref(storage, `quest_images/${Date.now()}_${auth.currentUser.uid}.jpg`);
      await uploadString(storageRef, capturedImage, 'data_url');
      const imageUrl = await getDownloadURL(storageRef);

      // Create quest document in Firestore
      const questData = {
        imageUrl,
        aspectRatio: selectedAspectRatio,
        time,
        user: currentUser?.name || 'Anonymous',
        description,
        createdAt: new Date().toISOString(),
        userId: auth.currentUser.uid
      };

      await addDoc(collection(db, 'quests'), questData);

      console.log('Quest uploaded successfully');
      onClose();
      navigate('/home'); // Redirect to home page after successful upload
    } catch (error) {
      console.error('Error uploading quest:', error);
      // Handle error (e.g., show error message to user)
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="camera-overlay">
      {!capturedImage ? (
        <CameraComponent
          handleCapture={handleCapture}
          isFullScreenCamera={true}
          cameraResolution={{ width: 1920, height: 1080 }}
        />
      ) : (
        <div className="image-preview">
          <img src={capturedImage} alt="Captured" className="captured-image" />
          <div className="aspect-ratio-selector">
            <button onClick={() => handleAspectRatioChange('1:1')}>1:1</button>
            <button onClick={() => handleAspectRatioChange('4:5')}>4:5</button>
            <button onClick={() => handleAspectRatioChange('16:9')}>16:9</button>
          </div>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Add a description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="description-input"
          />
        </div>
      )}
      <div className="overlay-controls">
        <IconButton onClick={onClose} className="back-button">
          <ArrowBack />
        </IconButton>
        {capturedImage && (
          <IconButton onClick={handleConfirm} disabled={isUploading} className="confirm-button">
            {isUploading ? <CircularProgress size={24} /> : <Check />}
          </IconButton>
        )}
      </div>
    </div>
  );
};

export default CameraOverlay;
