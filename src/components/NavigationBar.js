import React from 'react';

const NavigationBar = ({ activeSection, showSection }) => {
  return (
    <div className={`nav-bar ${activeSection ? 'hide-nav-bar' : ''}`}>
      <nav>
        <button onClick={() => showSection('profile-section')} className="nav-button">
          <img src="profile.png" alt="Profile Icon" />
        </button>
        <button onClick={() => showSection('connections-section')} className="nav-button">
          <img src="connections.png" alt="Connections Icon" />
        </button>
        <button onClick={() => showSection('quests-section')} className="nav-button">
          <img src="quest.png" alt="Quests Icon" />
        </button>
        <button onClick={() => showSection('history-section')} className="nav-button">
          <img src="history.png" alt="History Icon" />
        </button>
      </nav>
    </div>
  );
};

export default NavigationBar;