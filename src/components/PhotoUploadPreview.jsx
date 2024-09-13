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
  backgroundColor: '#000000',
  borderRadius: '20px',
  width: '90%',
  maxWidth: '500px',
  height: '90%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

const FullImageContainer = styled('div')({
  position: 'relative',
  width: '100%',
  height: 'calc(100% - 150px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  backgroundColor: '#000000',
});

const FullImage = styled('img')({
  maxWidth: '100%',
  maxHeight: '100%',
  objectFit: 'contain',
});

const CardOutline = styled('div')({
  position: 'absolute',
  border: '2px solid white',
  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
  cursor: 'move',
});

const ControlsContainer = styled('div')({
  padding: '20px',
  backgroundColor: '#000000',
});

const AspectRatioSelect = styled(RadioGroup)({
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '20px',
});

const StyledRadio = styled(Radio)({
  color: 'white',
  '&.Mui-checked': {
    color: 'white',
  },
});

const StyledFormControlLabel = styled(FormControlLabel)({
  '& .MuiFormControlLabel-label': {
    color: 'white',
  },
});

const ButtonGroup = styled('div')({
  display: 'flex',
  justifyContent: 'space-between',
});

const StyledButton = styled(Button)({
  flex: 1,
  margin: '0 5px',
  fontWeight: 'bold',
  borderRadius: '25px',
  padding: '12px 0',
});

const aspectRatios = [
  { value: '1:1', label: '1:1' },
  { value: '4:5', label: '4:5' },
  { value: '3:4', label: '3:4' },
  { value: '2:3', label: '2:3' },
  { value: '9:16', label: '9:16' },
];

const PhotoUploadPreview = ({ photoPreview, onUpload, onCancel }) => {
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
    };
    img.src = photoPreview;
  }, [photoPreview]);

  useEffect(() => {
    adjustCardSize();
  }, [aspectRatio, imageSize]);

  const adjustCardSize = () => {
    if (containerRef.current && imageSize.width && imageSize.height) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const [aspectWidth, aspectHeight] = aspectRatio.split(':').map(Number);
      const containerAspect = containerRect.width / containerRect.height;
      const imageAspect = imageSize.width / imageSize.height;
      const cardAspect = aspectWidth / aspectHeight;

      let newWidth, newHeight;

      if (cardAspect > imageAspect) {
        // Card is wider than image
        newWidth = containerRect.width;
        newHeight = newWidth / cardAspect;
      } else {
        // Card is taller than image
        newHeight = containerRect.height;
        newWidth = newHeight * cardAspect;
      }

      setCardSize({ width: newWidth, height: newHeight });
      setCardPosition({
        x: (containerRect.width - newWidth) / 2,
        y: (containerRect.height - newHeight) / 2,
      });
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    const startX = e.clientX - cardPosition.x;
    const startY = e.clientY - cardPosition.y;

    const handleMouseMove = (e) => {
      if (containerRef.current && cardRef.current && imageRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const imageRect = imageRef.current.getBoundingClientRect();

        let newX = e.clientX - startX;
        let newY = e.clientY - startY;

        // Constrain movement within the image bounds
        newX = Math.max(imageRect.left - containerRect.left, Math.min(newX, imageRect.right - containerRect.left - cardSize.width));
        newY = Math.max(imageRect.top - containerRect.top, Math.min(newY, imageRect.bottom - containerRect.top - cardSize.height));

        setCardPosition({ x: newX, y: newY });
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
    if (imageRef.current && cardRef.current) {
      const imageRect = imageRef.current.getBoundingClientRect();
      const cardRect = cardRef.current.getBoundingClientRect();
      
      const cropInfo = {
        x: (cardRect.left - imageRect.left) / imageRect.width,
        y: (cardRect.top - imageRect.top) / imageRect.height,
        width: cardRect.width / imageRect.width,
        height: cardRect.height / imageRect.height
      };

      onUpload(cropInfo, aspectRatio);
    }
  };

  return (
    <PreviewOverlay>
      <PreviewContainer>
        <FullImageContainer ref={containerRef}>
          <FullImage ref={imageRef} src={photoPreview} alt="Preview" />
          <CardOutline
            ref={cardRef}
            style={{
              width: `${cardSize.width}px`,
              height: `${cardSize.height}px`,
              left: `${cardPosition.x}px`,
              top: `${cardPosition.y}px`,
            }}
            onMouseDown={handleMouseDown}
          />
        </FullImageContainer>
        <ControlsContainer>
          <AspectRatioSelect
            row
            aria-label="aspect-ratio"
            name="aspect-ratio"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
          >
            {aspectRatios.map((ratio) => (
              <StyledFormControlLabel key={ratio.value} value={ratio.value} control={<StyledRadio />} label={ratio.label} />
            ))}
          </AspectRatioSelect>
          <ButtonGroup>
            <StyledButton onClick={handleUpload} variant="contained" color="primary">
              Done
            </StyledButton>
            <StyledButton onClick={onCancel} variant="outlined">
              Cancel
            </StyledButton>
          </ButtonGroup>
        </ControlsContainer>
      </PreviewContainer>
    </PreviewOverlay>
  );
};

export default PhotoUploadPreview;