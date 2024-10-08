import React, { useState } from 'react';

const ImagePreview = React.memo(({ selectedImage, comments, onClose, onAddComment, onDeletePost }) => {
    const [localComment, setLocalComment] = useState('');
  
    const handleAddComment = () => {
      onAddComment(localComment);
      setLocalComment('');
    };
  
    return (
      <div className="image-preview-overlay" onClick={onClose}>
        <div className="image-preview-content" onClick={e => e.stopPropagation()}>
          <div className="image-preview-main">
            <img src={selectedImage?.image} alt="Preview" className="preview-image" />
          </div>
          <div className="image-preview-sidebar">
            <div className="image-preview-header">
              <div className="user-info">
                <img src={selectedImage?.user?.profilePhoto || '/default-profile-image.jpg'} alt="User" className="user-avatar" />
                <span className="username">{selectedImage?.user?.name || 'Unknown User'}</span>
              </div>
              <IconButton onClick={onClose} className="close-button">
                <Close />
              </IconButton>
            </div>
            <div className="quest-info">
              {selectedImage?.questTitle ? (
                <p className="quest-title">{selectedImage.questTitle}</p>
              ) : (
                <p className="quest-break">Taking a break from quests</p>
              )}
            </div>
            {selectedImage?.caption && (
              <p className="image-caption">{selectedImage.caption}</p>
            )}
            <div className="comments-section">
              {comments.map(comment => (
                <div key={comment.id} className="comment">
                  <img 
                    src={comment.userProfileImage || '/default-profile-image.jpg'} 
                    alt={comment.username} 
                    className="comment-user-avatar"
                  />
                  <div className="comment-content">
                    <strong>{comment.username}</strong>
                    <p>{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="add-comment">
              <TextField
                value={localComment}
                onChange={(e) => setLocalComment(e.target.value)}
                placeholder="Add a comment..."
                fullWidth
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={handleAddComment}>
                      <Send />
                    </IconButton>
                  ),
                }}
              />
            </div>
            {selectedImage?.userId === auth.currentUser?.uid && (
              <Button
                startIcon={<Delete />}
                onClick={onDeletePost}
                className="delete-button"
              >
                Delete Post
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  });

export default ImagePreview;