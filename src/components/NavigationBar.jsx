import React from 'react';
import '../styles/HomeScreen.css';

const NavigationBar = ({ activeSection, showSection, logo, title }) => {
  const navItems = [
    { id: 'home', icon: '/home.png', label: 'Feed' },
    { id: 'profile', icon: '/user-avatar.png', label: 'Profile' },
    { id: 'connections', icon: '/happy.png', label: 'Connections' },
    { id: 'quests', icon: '/letter.png', label: 'Quests' },
    { id: 'privacy', icon: '/privacy1.png', label: 'Privacy' },
  ];

  return (
    <div className="nav-bar">
      <div className="nav-header">
        <img src={logo} alt="Quests Logo" className="qlogo" />
        <span className="nav-title">{title}</span>
      </div>
      <nav>
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => showSection(item.id)}
            className={`nav-button ${
              activeSection === item.id ? 'active' : ''
            }`}
          >
            <img src={item.icon} alt={item.label} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default NavigationBar;
