import React from 'react';
import './Feed.css';

import QuestCard from './card/QuestCard';

function Feed() {
  return (
    <div className="feed">
      <QuestCard aspectRatio={3/4}/>
      <QuestCard aspectRatio={9/16}/>
      <QuestCard aspectRatio={1/1}/>
      <QuestCard aspectRatio={3/4}/>
      <QuestCard aspectRatio={1/1}/>
      <QuestCard aspectRatio={9/16}/>
      <QuestCard aspectRatio={1/1}/>
      <QuestCard aspectRatio={1/1}/>
      <QuestCard aspectRatio={9/16}/>
      <QuestCard aspectRatio={3/4}/>
      <QuestCard aspectRatio={9/16}/>
    </div>
  );
}

export default Feed;
