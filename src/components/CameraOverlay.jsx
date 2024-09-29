import React, { useState, useCallback, useRef } from 'react';
import { IconButton, TextField, Button } from '@mui/material';
import { Camera } from 'react-camera-pro';
import { ArrowBack, Refresh, Check, Crop } from '@mui/icons-material';
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
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [time, setTime] = useState('');
  const currentUser = useUser();
  const navigate = useNavigate();
  const cameraRef = useRef(null);

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

        setCapturedImage(highQualityImageSrc);
        setTime(new Date().toLocaleTimeString());
      };
      img.src = imageSrc;
    }
  }, []);

  const handleAspectRatioChange = (ratio) => {
    setSelectedAspectRatio(ratio);
    setIsCropFinalized(false);
    updateCropArea(ratio);
  };

  const updateCropArea = (ratio) => {
    if (imageRef.current) {
      const imgRect = imageRef.current.getBoundingClientRect();
      const [widthRatio, heightRatio] = ratio.split(':').map(Number);
      let newWidth, newHeight;

      if (imgRect.width / imgRect.height > widthRatio / heightRatio) {
        // Image is wider than the desired ratio
        newHeight = imgRect.height;
        newWidth = (newHeight * widthRatio) / heightRatio;
      } else {
        // Image is taller than the desired ratio
        newWidth = imgRect.width;
        newHeight = (newWidth * heightRatio) / widthRatio;
      }

      // Ensure the crop area doesn't exceed the image boundaries
      newWidth = Math.min(newWidth, imgRect.width);
      newHeight = Math.min(newHeight, imgRect.height);

      setCropSize({ width: newWidth, height: newHeight });
      setCropPosition({
        x: (imgRect.width - newWidth) / 2,
        y: (imgRect.height - newHeight) / 2
      });
    }
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
      navigate('/home/*');
    } catch (error) {
      console.error('Error uploading quest:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const cropImage = () => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = imageRef.current;
      const crop = cropRef.current;

      if (!img || !crop) {
        console.error('Image or crop reference is missing');
        resolve(null);
        return;
      }

      const [widthRatio, heightRatio] = selectedAspectRatio.split(':').map(Number);
      const cropWidth = crop.offsetWidth;
      const cropHeight = crop.offsetHeight;

      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;

      canvas.width = cropWidth * scaleX;
      canvas.height = cropHeight * scaleY;

      ctx.drawImage(
        img,
        cropPosition.x * scaleX,
        cropPosition.y * scaleY,
        cropWidth * scaleX,
        cropHeight * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Failed to create blob from canvas');
          resolve(null);
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      }, 'image/jpeg');
    });
  };

  const handleCropMove = (e) => {
    if (cropRef.current && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const cropRect = cropRef.current.getBoundingClientRect();
      let newX = e.clientX - rect.left - cropRect.width / 2;
      let newY = e.clientY - rect.top - cropRect.height / 2;

      newX = Math.max(0, Math.min(newX, rect.width - cropRect.width));
      newY = Math.max(0, Math.min(newY, rect.height - cropRect.height));

      setCropPosition({ x: newX, y: newY });
    }
  };

  const handleBack = () => {
    if (capturedImage) {
      setCapturedImage(null);
      setIsCropFinalized(false);
    } else {
      navigate('/home/*');
    }
  };

  useEffect(() => {
    if (imageRef.current && cropRef.current) {
      const imgRect = imageRef.current.getBoundingClientRect();
      const cropRect = cropRef.current.getBoundingClientRect();
      setCropPosition({
        x: (imgRect.width - cropRect.width) / 2,
        y: (imgRect.height - cropRect.height) / 2
      });
    }
  }, [selectedAspectRatio]);

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
          <div className="image-preview" onMouseMove={handleCropMove}>
            <img ref={imageRef} src={capturedImage} alt="Captured" className="captured-image" />
            <div
              ref={cropRef}
              className="crop-outline"
              style={{
                aspectRatio: selectedAspectRatio,
                left: `${cropPosition.x}px`,
                top: `${cropPosition.y}px`
              }}
            >
              <Crop className="crop-icon" />
            </div>
          </div>
          <div className="controls-container">
            <div className="aspect-ratio-selector">
              {['1:1', '4:5', '9:16'].map((ratio) => (
                <Button
                  key={ratio}
                  variant={selectedAspectRatio === ratio ? "contained" : "outlined"}
                  onClick={() => handleAspectRatioChange(ratio)}
                  className="aspect-ratio-button"
                  disabled={isCropFinalized}
                >
                  {ratio}
                </Button>
              ))}
            </div>
            {isCropFinalized && (
              <Button
                variant="outlined"
                onClick={handleResetCrop}
                className="reset-crop-button"
                startIcon={<Undo />}
              >
                Reset Crop
              </Button>
            )}
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
              disabled={isUploading || !isCropFinalized}
              className="confirm-btn"
            >
              Done
            </Button>
          </div>
          <Button onClick={handleBack} className="back-bttn">
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

export default CameraOverlay;