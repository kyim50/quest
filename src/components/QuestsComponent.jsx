import React from 'react';
import Quests from './Quests';

const QuestsComponent = ({ isOpen, quests, currentUserIds, map }) => {
  return (
    <div className={`quests-window ${isOpen ? 'show-section' : 'hide-section'}`}>
      <Quests quests={quests} currentUserIds={currentUserIds} map={map} />
    </div>
  );
};

export default QuestsComponent;