import React, { useState, useEffect, useRef } from 'react';
import { Camera } from 'react-camera-pro';
import { Grid, Tab, Tabs, Button, TextField, CircularProgress } from '@mui/material';
import { FlashOn, CameraAlt, Refresh } from '@mui/icons-material';
import {
  auth,
  db,
  storage,
  uploadImage,
  createQuest,
  fetchSentQuests,
  fetchReceivedQuests
} from '../firebase';
import { collection, addDoc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const HistorySection = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [capturedImage, setCapturedImage] = useState(null);
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [quests, setQuests] = useState([]);
  const cameraRef = useRef(null);
  const [facingMode, setFacingMode] = useState('environment');

  useEffect(() => {
    fetchQuests();
  }, [currentUser]);

  const fetchQuests = async () => {
    if (!currentUser) return;

    setIsLoading(true);
    try {
      const sentQuests = await fetchSentQuests(currentUser.uid);
      const receivedQuests = await fetchReceivedQuests(currentUser.uid);
      setQuests([...sentQuests, ...receivedQuests].sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error('Error fetching quests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCapture = () => {
    const imageSrc = cameraRef.current.takePhoto();
    setCapturedImage(imageSrc);
  };

  const handleFlipCamera = () => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  };

  const handleUpload = async () => {
    if (!capturedImage || !caption) {
      alert('Please capture an image and add a caption');
      return;
    }

    setIsLoading(true);
    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      // Upload image to Firebase Storage
      const imageUrl = await uploadImage(blob);

      // Create a new quest
      await createQuest(currentUser.uid, currentUser.uid, {
        imageUrl,
        caption,
        createdAt: Date.now(),
      });

      setCapturedImage(null);
      setCaption('');
      fetchQuests(); // Refresh the quests list
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="history-section">
      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
        <Tab label="Capture" />
        <Tab label="History" />
      </Tabs>

      {activeTab === 0 && (
        <div className="capture-tab">
          <div className="camera-container">
            <div className="camera-wrapper">
              <Camera
                ref={cameraRef}
                facingMode={facingMode}
                aspectRatio={1}
                errorMessages={{}}
              />
            </div>
            <div className="camera-controls">
              <button className="control-button flash-button">
                <FlashOn />
              </button>
              <button className="control-button capture-button" onClick={handleCapture}>
                <CameraAlt />
              </button>
              <button className="control-button flip-button" onClick={handleFlipCamera}>
                <Refresh />
              </button>
            </div>
          </div>
          {capturedImage && (
            <div className="preview-container">
              <img src={capturedImage} alt="Captured" className="captured-image" />
              <div className="caption-bubble">
                <TextField
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  fullWidth
                  margin="normal"
                  variant="standard"
                />
              </div>
              <Button onClick={handleUpload} disabled={isLoading}>
                {isLoading ? <CircularProgress size={24} /> : 'Upload'}
              </Button>
            </div>
          )}
        </div>
      )}

      {activeTab === 1 && (
        <div className="history-tab">
          {isLoading ? (
            <CircularProgress />
          ) : (
            <Grid container spacing={2}>
              {quests.map((quest, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <img src={quest.imageUrl} alt={`Quest ${index}`} style={{ maxWidth: '100%' }} />
                  <p>{quest.caption}</p>
                  <p>Created: {new Date(quest.createdAt).toLocaleString()}</p>
                </Grid>
              ))}
            </Grid>
          )}
        </div>
      )}
    </div>
  );
};

export default HistorySection;