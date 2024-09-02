import React, { useState, useEffect, useRef } from 'react';
import { TextField, Button, Radio, RadioGroup, FormControlLabel } from '@mui/material';
import { styled } from '@mui/system';

const PreviewOverlay = styled('div')({
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  backdropFilter: 'blur(5px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 2000,
});

const PreviewContainer = styled('div')({
  backgroundColor: '#1E1E1E',
  borderRadius: '20px',
  width: '90%',
  maxWidth: '1200px',
  height: '90%',
  display: 'flex',
  overflow: 'hidden',
});

const ImageContainer = styled('div')({
  flex: 2,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: '#2C2C2C',
});

const PreviewImage = styled('div')(({ size }) => ({
  position: 'relative',
  overflow: 'hidden',
  borderRadius: '16px',
  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
  ...(size === 'small' && { width: '200px', height: '200px' }),
  ...(size === 'medium' && { width: '300px', height: '300px' }),
  ...(size === 'large' && { width: '400px', height: '400px' }),
}));

const StyledImg = styled('img')({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

const ControlsContainer = styled('div')({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  padding: '30px',
  backgroundColor: '#2C2C2C',
});

const SizeSelect = styled(RadioGroup)({
  marginBottom: '20px',
});

const StyledTextField = styled(TextField)({
  marginBottom: '20px',
  '& .MuiInputBase-root': {
    color: 'white',
    backgroundColor: '#3C3C3C',
  },
  '& .MuiInputLabel-root': {
    color: '#CCCCCC',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: '#4C4C4C',
  },
});

const ButtonGroup = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
  marginTop: 'auto',
});

const StyledButton = styled(Button)({
  flex: 1,
  margin: '0 5px',
  fontWeight: 'bold',
  borderRadius: '25px',
  padding: '12px 0',
});

const UserInfo = styled('div')({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#3C3C3C',
  padding: '15px',
  borderRadius: '10px',
  marginTop: '20px',
});

const UserAvatar = styled('img')({
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  marginRight: '15px',
});

const Username = styled('span')({
  color: 'white',
  fontWeight: 'bold',
  fontSize: '18px',
});

const PhotoUploadPreview = ({ photoPreview, initialPhotoSize, initialCaption, onUpload, onCancel, currentUser }) => {
  const [photoSize, setPhotoSize] = useState(initialPhotoSize);
  const [caption, setCaption] = useState(initialCaption);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const previewRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
    };
    img.src = photoPreview;
  }, [photoPreview]);

  useEffect(() => {
    adjustImagePosition();
  }, [photoSize, imageSize]);

  const adjustImagePosition = () => {
    if (previewRef.current && imageSize.width && imageSize.height) {
      const previewRect = previewRef.current.getBoundingClientRect();
      const imageAspect = imageSize.width / imageSize.height;
      const previewAspect = previewRect.width / previewRect.height;

      let newScale, newX, newY;

      if (imageAspect > previewAspect) {
        // Image is wider
        newScale = previewRect.height / imageSize.height;
        newX = (previewRect.width - imageSize.width * newScale) / 2;
        newY = 0;
      } else {
        // Image is taller
        newScale = previewRect.width / imageSize.width;
        newX = 0;
        newY = (previewRect.height - imageSize.height * newScale) / 2;
      }

      setScale(newScale);
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (e) => {
      if (previewRef.current && imageRef.current) {
        const previewRect = previewRef.current.getBoundingClientRect();
        const imageRect = imageRef.current.getBoundingClientRect();

        let newX = e.clientX - startX;
        let newY = e.clientY - startY;

        // Constrain movement
        newX = Math.min(0, Math.max(previewRect.width - imageRect.width, newX));
        newY = Math.min(0, Math.max(previewRect.height - imageRect.height, newY));

        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleUpload = () => {
    const previewRect = previewRef.current.getBoundingClientRect();
    const imageRect = imageRef.current.getBoundingClientRect();
    
    const cropInfo = {
      x: (previewRect.left - imageRect.left) / imageRect.width,
      y: (previewRect.top - imageRect.top) / imageRect.height,
      width: previewRect.width / imageRect.width,
      height: previewRect.height / imageRect.height
    };

    onUpload(cropInfo, photoSize, caption);
  };

  return (
    <PreviewOverlay>
      <PreviewContainer>
        <ImageContainer>
          <PreviewImage ref={previewRef} size={photoSize}>
            <StyledImg
              ref={imageRef}
              src={photoPreview}
              alt="Preview"
              style={{
                transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
                transformOrigin: 'top left',
              }}
              onMouseDown={handleMouseDown}
            />
          </PreviewImage>
        </ImageContainer>
        <ControlsContainer>
          <SizeSelect
            row
            aria-label="photo-size"
            name="photo-size"
            value={photoSize}
            onChange={(e) => setPhotoSize(e.target.value)}
          >
            <FormControlLabel value="small" control={<Radio />} label="Small" />
            <FormControlLabel value="medium" control={<Radio />} label="Medium" />
            <FormControlLabel value="large" control={<Radio />} label="Large" />
          </SizeSelect>
          <StyledTextField
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption..."
            fullWidth
            multiline
            rows={4}
            variant="outlined"
          />
          <ButtonGroup>
            <StyledButton onClick={handleUpload} variant="contained" color="primary">
              Upload
            </StyledButton>
            <StyledButton onClick={onCancel} variant="outlined">
              Cancel
            </StyledButton>
          </ButtonGroup>
          <UserInfo>
            <UserAvatar src={currentUser?.profilePhoto || '/default-profile-image.jpg'} alt={currentUser?.name} />
            <Username>{currentUser?.name}</Username>
          </UserInfo>
        </ControlsContainer>
      </PreviewContainer>
    </PreviewOverlay>
  );
};

export default PhotoUploadPreview;