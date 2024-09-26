import React from 'react';
import './QuestCard.css';

function QuestCard({ imageUrl, aspectRatio, time, user, description }) {
  const [widthRatio, heightRatio] = aspectRatio ? aspectRatio.split(':').map(Number) : [1, 1];
  const aspectRatioValue = widthRatio / heightRatio;

  return (
    <div
      className="quest-card"
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
    
  );
}

export default QuestCard;
