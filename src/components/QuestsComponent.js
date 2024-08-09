import React from 'react';
import Quests from './Quests';

const QuestsComponent = ({ isOpen, quests, currentUserIds }) => {
  return (
    <div className={`quests-window ${isOpen ? 'show-section' : 'hide-section'}`}>
      <Quests quests={quests} currentUserIds={currentUserIds} />
    </div>
  );
};

export default QuestsComponent;
