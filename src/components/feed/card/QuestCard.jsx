import React, { useState, useEffect } from 'react';
import './QuestCard.css';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';

function QuestCard({ id, imageUrl, aspectRatio, time, user, description, comments, onAddComment }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [questData, setQuestData] = useState(null);

  useEffect(() => {
    const fetchQuestData = async () => {
      if (id) {
        const questDoc = await getDoc(doc(db, 'quests', id));
        if (questDoc.exists()) {
          setQuestData({ id: questDoc.id, ...questDoc.data() });
        }
      }
    };

    fetchQuestData();
  }, [id]);

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

  // Use questData if available, otherwise fall back to props
  const displayData = questData || { imageUrl, aspectRatio, time, user, description, comments };

  const [widthRatio, heightRatio] = displayData.aspectRatio ? displayData.aspectRatio.split(':').map(Number) : [1, 1];
  const aspectRatioValue = widthRatio / heightRatio;

  return (
    <div className={`quest-card ${isExpanded ? 'expanded' : ''}`} onClick={handleCardClick}>
      <div className="quest-card-inner">
        <div
          className="quest-card-content"
          style={{
            backgroundImage: `url(${displayData.imageUrl})`,
            aspectRatio: aspectRatioValue,
          }}
        >
          <div className="header">
            <div className="time">{displayData.time}</div>
          </div>
          <div className="footer">
            <p className="user">{displayData.user}</p>
            <p className="description">{displayData.description}</p>
          </div>
        </div>
        {isExpanded && (
          <div className="comments-section" onClick={handleCommentClick}>
            <h3>Comments</h3>
            <div className="comments-list">
              {displayData.comments && displayData.comments.map((comment, index) => (
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