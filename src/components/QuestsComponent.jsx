import React from 'react';
import Quests from './Quests';
import NavigationModalWrapper from './navigation-modal/NavigationModalWrapper';

const QuestsComponent = ({ isOpen, quests, currentUserIds, map }) => {
  return (
    <NavigationModalWrapper>
      <div
        className={`quests-window ${isOpen ? 'show-section' : 'hide-section'}`}
      >
        <Quests quests={quests} currentUserIds={currentUserIds} map={map} />
      </div>
    </NavigationModalWrapper>
  );
};

export default QuestsComponent;
