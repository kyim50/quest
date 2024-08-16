import React from 'react';

const NavigationBar = ({ activeSection, showSection }) => {
  return (
    <div className="nav-bar">
      <div className="nav-header">
      <img src="quests logo.png" alt="Quests Logo" className="logo" 
          onClick={() => showSection('home')}
        />
      </div>
      <nav>
        <button onClick={() => showSection('profile')} className={`nav-button ${activeSection === 'profile' ? 'active' : ''}`}>
          <img src="/profile.png" alt="Profile" />
          <span>Profile</span>
        </button>
        <button onClick={() => showSection('connections')} className={`nav-button ${activeSection === 'connections' ? 'active' : ''}`}>
          <img src="/connections.png" alt="Connections" />
          <span>Connections</span>
        </button>
        <button onClick={() => showSection('quests')} className={`nav-button ${activeSection === 'quests' ? 'active' : ''}`}>
          <img src="/quest.png" alt="Quests" />
          <span>Quests</span>
        </button>
        <button onClick={() => showSection('history')} className={`nav-button ${activeSection === 'history' ? 'active' : ''}`}>
          <img src="/history.png" alt="History" />
          <span>History</span>
        </button>
      </nav>
      <div className="nav-footer">
        <button className="theme-toggle">
          <img src="/night-mode-icon.png" alt="Night Mode" />
          <span>Night Mode</span>
        </button>
      </div>
    </div>
  );
};

export default NavigationBar;