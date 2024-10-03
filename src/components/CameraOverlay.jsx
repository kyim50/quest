import React, { useState, useCallback, useRef, useEffect } from 'react';
import { IconButton, TextField, Button } from '@mui/material';
import { Camera } from 'react-camera-pro';
import { ArrowBack, Refresh, Check, Crop, Undo } from '@mui/icons-material';
import { useUser } from './UserProvider';
import { useNavigate } from 'react-router-dom';
import { storage, db, auth } from '../firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { addDoc, collection } from 'firebase/firestore';

const CameraOverlay = () => {
  const [capturedImage, setCapturedImage] = useState(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [cropSize, setCropSize] = useState({ width: 0, height: 0 });
  const [time, setTime] = useState('');
  const [facingMode, setFacingMode] = useState('user');
  const [isCropFinalized, setIsCropFinalized] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isAspectRatioSelected, setIsAspectRatioSelected] = useState(false);
  const currentUser = useUser();
  const navigate = useNavigate();
  const cameraRef = useRef(null);
  const imageRef = useRef(null);
  const cropRef = useRef(null);

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
    setIsAspectRatioSelected(true);
    setIsCropFinalized(false);
    updateCropArea(ratio);
  };

  const updateCropArea = (ratio) => {
    if (imageRef.current) {
      const imgRect = imageRef.current.getBoundingClientRect();
      const [widthRatio, heightRatio] = ratio.split(':').map(Number);
      let newWidth, newHeight;

      if (imgRect.width / imgRect.height > widthRatio / heightRatio) {
        newHeight = imgRect.height;
        newWidth = (newHeight * widthRatio) / heightRatio;
      } else {
        newWidth = imgRect.width;
        newHeight = (newWidth * heightRatio) / widthRatio;
      }

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
      const croppedImage = await cropImage();
      const storageRef = ref(storage, `quest_images/${Date.now()}_${auth.currentUser.uid}.jpg`);
      await uploadString(storageRef, croppedImage, 'data_url');
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
      navigate('/home');
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

      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;

      canvas.width = cropSize.width * scaleX;
      canvas.height = cropSize.height * scaleY;

      ctx.drawImage(
        img,
        cropPosition.x * scaleX,
        cropPosition.y * scaleY,
        cropSize.width * scaleX,
        cropSize.height * scaleY,
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
      setIsAspectRatioSelected(false);
    } else {
      navigate('/home');
    }
  };

  const toggleCamera = () => {
    setFacingMode((prevMode) => (prevMode === 'user' ? 'environment' : 'user'));
  };

  const handleFinalizeCrop = () => {
    setIsCropFinalized(true);
    setIsAspectRatioSelected(false);
  };

  const handleResetCrop = () => {
    setIsCropFinalized(false);
    setIsAspectRatioSelected(true);
    updateCropArea(selectedAspectRatio);
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      backgroundColor: '#000',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10001,
      border: 'solid 50px white',
      borderRadius: '50px'
    }}>
      {cameraError && <div style={{ color: 'red' }}>{cameraError}</div>}
      {!capturedImage ? (
        <>
        <div style={{
          borderRadius: '25px', 
          overflow: '', 
          border: 'solid 10px blue',
          width: '100%',   /* Ensure container takes up full width */
          height: '100%',  /* Adjust height as necessary or set a specific value */
          display: 'inline-block',
          position: 'absolute'}}>
          <Camera
            ref={cameraRef} 
            facingMode={facingMode}
            aspectRatio="cover"
            errorMessages={{}}
            videoSourceDeviceId={undefined}
            numberOfCamerasCallback={(i) => console.log(i)}
            videoResolution="highest"
            onError={(error) => setCameraError('Could not start video source. Please check your camera permissions.')}
          />
          </div>
          <div style={{
            position: 'absolute',
            bottom: '40px',
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <IconButton onClick={handleBack} style={{ color: '#fff' }}>
              <ArrowBack />
            </IconButton>
            <IconButton onClick={handleCapture} style={{
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: '30px',
              marginLeft: '30px'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: '#fff',
              }} />
            </IconButton>
            <IconButton onClick={toggleCamera} style={{ color: '#fff' }}>
              <Refresh />
            </IconButton>
          </div>
        </>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%',
          width: '100%',
          backgroundColor: '#000',
        }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 'calc(100% - 200px)',
              overflow: 'hidden',
            }}
            onMouseMove={handleCropMove}
          >
            <img ref={imageRef} src={capturedImage} alt="Captured" style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scalex(-1)',
            }} />
            <div
              ref={cropRef}
              style={{
                position: 'absolute',
                border: '2px solid #fff',
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                left: `${cropPosition.x}px`,
                top: `${cropPosition.y}px`,
                width: `${cropSize.width}px`,
                height: `${cropSize.height}px`,
              }}
            >
              <Crop style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                color: '#fff',
                fontSize: '24px',
              }} />
            </div>
          </div>
          <div style={{
            width: '100%',
            padding: '20px',
            backgroundColor: '#fff',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-around',
              marginBottom: '20px',
            }}>
              {['1:1', '4:5', '9:16'].map((ratio) => (
                <Button
                  key={ratio}
                  onClick={() => handleAspectRatioChange(ratio)}
                  style={{
                    flex: 1,
                    margin: '0 5px',
                    padding: '10px',
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    height: '70px',
                    width: '70px',
                    textTransform: 'none',
                    backgroundColor: selectedAspectRatio === ratio ? '#3797EF' : 'transparent',
                    color: selectedAspectRatio === ratio ? '#fff' : '#3797EF',
                    border: selectedAspectRatio === ratio ? 'none' : '2px solid #333333',
                  }}
                  disabled={isCropFinalized}
                >
                  {ratio}
                </Button>
              ))}
            </div>
            {isAspectRatioSelected && !isCropFinalized && (
              <Button
                variant="contained"
                onClick={handleFinalizeCrop}
                style={{
                  width: '100%',
                  marginBottom: '20px',
                  borderRadius: '20px',
                  backgroundColor: '#3797EF',
                  color: '#fff',
                  fontWeight: 'bold',
                  textTransform: 'none',
                }}
              >
                Finalize Crop
              </Button>
            )}
            {isCropFinalized && (
              <Button
                variant="outlined"
                onClick={handleResetCrop}
                style={{
                  width: '100%',
                  marginBottom: '20px',
                  borderRadius: '20px',
                  color: '#3797EF',
                  borderColor: '#3797EF',
                }}
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
              style={{
                marginBottom: '20px',
              }}
              InputProps={{
                style: {
                  borderRadius: '20px',
                },
              }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleConfirm}
              disabled={isUploading || !isCropFinalized}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '20px',
                backgroundColor: '#3797EF',
                color: '#fff',
                fontWeight: 'bold',
                textTransform: 'none',
              }}
            >
              Done
            </Button>
          </div>
          <Button onClick={handleBack} style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            color: '#fff',
            fontWeight: 'bold',
          }}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

export default CameraOverlay;