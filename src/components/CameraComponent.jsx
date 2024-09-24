import React, { useState, useEffect, useCallback, useRef } from 'react';
import { IconButton } from '@mui/material';
import { Camera } from 'react-camera-pro';
import { ArrowBack, Refresh } from '@mui/icons-material';
import '../styles/HomeScreen.css';

const CameraComponent = ({
  facingMode,
  toggleCamera,
  handleCapture,
  handleFlipCamera,
  isFullScreenCamera,
  cameraResolution
}) => {
  const cameraRef = useRef(null);

  const handleCaptureInternal = useCallback(() => {
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

        handleCapture(highQualityImageSrc);
      };
      img.src = imageSrc;
    }
  }, [handleCapture]);

  return (
    <div className={`camera-container ${isFullScreenCamera ? 'full-screen-camera' : ''}`}>
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
        <IconButton onClick={handleCaptureInternal} className="capture-button">
          <div className="capture-button-inner" />
        </IconButton>
        <IconButton onClick={handleFlipCamera} className="flip-button">
          <Refresh />
        </IconButton>
      </div>
    </div>
  );
};

export default CameraComponent;
