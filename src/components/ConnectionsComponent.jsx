import React from 'react';
import Connections from './Connections';

const ConnectionsComponent = ({ currentUserIds }) => {
  return (
    <section id="connections-section" className="content-section show-section">
      <Connections currentUserIds={currentUserIds} />
    </section>
  );
};

export default ConnectionsComponent;
