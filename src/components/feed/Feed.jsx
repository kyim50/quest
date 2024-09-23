import React from 'react';
import './Feed.css';

import QuestCard from './card/QuestCard';

function Feed() {
  return (
    <div className="feed">
      <QuestCard />
      <QuestCard />
      <QuestCard />
      <QuestCard />
      <QuestCard />
      <QuestCard />
    </div>
  );
}

export default Feed;
