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
  flexDirection: 'column',
  overflow: 'hidden',
});

const PreviewContent = styled('div')({
  display: 'flex',
  flex: 1,
  overflow: 'hidden',
});

const ImageContainer = styled('div')({
  flex: 2,
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: '#2C2C2C',
});

const FullPreviewImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
});

const CardOutline = styled('div')(({ size }) => ({
  position: 'absolute',
  border: '2px solid white',
  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
  borderRadius: '16px',
  transition: 'all 0.3s ease',
  cursor: 'grab',
  '&:active': {
    cursor: 'grabbing',
  },
  ...(size === 'small' && {
    width: '200px',
    height: '200px',
  }),
  ...(size === 'medium' && {
    width: '300px',
    height: '300px',
  }),
  ...(size === 'large' && {
    width: '400px',
    height: '400px',
  }),
}));

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
  const [outlinePosition, setOutlinePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const outlineRef = useRef(null);

  useEffect(() => {
    if (imageRef.current && containerRef.current && outlineRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const imgRect = imageRef.current.getBoundingClientRect();
      const outlineRect = outlineRef.current.getBoundingClientRect();
      
      setOutlinePosition({
        x: (imgRect.width - outlineRect.width) / 2,
        y: (imgRect.height - outlineRect.height) / 2
      });
    }
  }, [photoSize]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const outlineRect = outlineRef.current.getBoundingClientRect();

    const newX = outlinePosition.x + e.movementX;
    const newY = outlinePosition.y + e.movementY;

    const maxX = containerRect.width - outlineRect.width;
    const maxY = containerRect.height - outlineRect.height;

    setOutlinePosition({
      x: Math.max(0, Math.min(maxX, newX)),
      y: Math.max(0, Math.min(maxY, newY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleUpload = () => {
    const outlineRect = outlineRef.current.getBoundingClientRect();
    const imageRect = imageRef.current.getBoundingClientRect();
    
    const cropInfo = {
      x: (outlinePosition.x - imageRect.left) / imageRect.width,
      y: (outlinePosition.y - imageRect.top) / imageRect.height,
      width: outlineRect.width / imageRect.width,
      height: outlineRect.height / imageRect.height
    };

    onUpload(cropInfo, photoSize, caption);
  };

  return (
    <PreviewOverlay>
      <PreviewContainer>
        <PreviewContent>
          <ImageContainer ref={containerRef}>
            <FullPreviewImage ref={imageRef} src={photoPreview} alt="Preview" />
            <CardOutline
              ref={outlineRef}
              size={photoSize}
              style={{
                left: `${outlinePosition.x}px`,
                top: `${outlinePosition.y}px`,
              }}
              onMouseDown={handleMouseDown}
            />
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
        </PreviewContent>
      </PreviewContainer>
    </PreviewOverlay>
  );
};

export default PhotoUploadPreview;