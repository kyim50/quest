import React from 'react';
import './QuestCard.css';

function QuestCard({ imageUrl, aspectRatio, time, user, description, onClick }) {
  const [widthRatio, heightRatio] = aspectRatio ? aspectRatio.split(':').map(Number) : [1, 1];
  let aspectRatioValue = widthRatio / heightRatio;

  // Adjust aspect ratio for 16:9 to make it taller
  if (aspectRatio === '16:9') {
    aspectRatioValue = 9 / 16; // Invert the ratio to make it taller
  }

  return (
    <div
      className="quest-card"
      style={{
        backgroundImage: `url(${imageUrl})`,
        aspectRatio: aspectRatioValue,
      }}
      onClick={onClick}
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

export function DummyCard({ aspectRatio }) {
  return (
    <div
      className="quest-card"
      style={{
        backgroundImage:
          "url('https://media.tenor.com/o_5RQarGvJ0AAAAM/kiss.gif')",
        aspectRatio: aspectRatio,
      }}
    >
      <div className="header">
        <div className="time">8:08 PM</div>
      </div>
      <div className="footer">
        <p className="user">Kiity :3</p>
        <p className="description">I am cat and i love yuu</p>
      </div>
    </div>
  );
}



export default QuestCard;
