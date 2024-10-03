// QuestCard.jsx
import React, { useState } from 'react';
import './QuestCard.css';

function QuestCard({ id, imageUrl, aspectRatio, time, user, description, comments, onAddComment }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newComment, setNewComment] = useState('');

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCommentClick = (e) => {
    e.stopPropagation();
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(id, newComment);
      setNewComment('');
    }
  };

  const [widthRatio, heightRatio] = aspectRatio ? aspectRatio.split(':').map(Number) : [1, 1];
  let aspectRatioValue = widthRatio / heightRatio;

  if (aspectRatio === '16:9') {
    aspectRatioValue = 9 / 16;
  }

  return (
    <div className={`quest-card ${isExpanded ? 'expanded' : ''}`} onClick={handleCardClick}>
      <div className="quest-card-inner">
        <div
          className="quest-card-content"
          style={{
            backgroundImage: `url(${imageUrl})`,
            aspectRatio: aspectRatioValue,
          }}
        >
          <div className="header">
            <div className="time">{time}</div>
          </div>
          <div className="footer">
            <p className="user">{user}</p>
            <p className="description">{description}</p>
          </div>
        </div>
        {isExpanded && (
          <div className="comments-section" onClick={handleCommentClick}>
            <h3>Comments</h3>
            <div className="comments-list">
              {comments.map((comment, index) => (
                <div key={index} className="comment">
                  <img src={comment.userPhoto} alt={comment.userName} className="user-photo" />
                  <div className="comment-content">
                    <p className="comment-user">{comment.userName}</p>
                    <p className="comment-text">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <form className="add-comment" onSubmit={handleAddComment}>
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
              />
              <button type="submit">Post</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}



export default QuestCard;