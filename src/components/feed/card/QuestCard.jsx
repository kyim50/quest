import React from 'react';
import './QuestCard.css';

function QuestCard({ aspectRatio }) {
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
