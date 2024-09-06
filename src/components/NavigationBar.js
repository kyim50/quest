import React from 'react';
import '../styles/HomeScreen.css';

const NavigationBar = ({ activeSection, showSection, logo, title }) => {
  const navItems = [
    { id: 'home', icon: '/home.png', label: 'Home' },
    { id: 'profile', icon: '/profile.png', label: 'Profile' },
    { id: 'connections', icon: '/connections.png', label: 'Connections' },
    { id: 'quests', icon: '/quest.png', label: 'Quests' },
    { id: 'privacy', icon: '/privacy.png', label: 'Privacy' },
  ];

  return (
    <div className="nav-bar">
      <div className="nav-header">
        <img 
          src={logo}
          alt="Quests Logo" 
          className="qlogo" 
        />
        <span className="nav-title">{title}</span>
      </div>
      <nav>
        {navItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => showSection(item.id)} 
            className={`nav-button ${activeSection === item.id ? 'active' : ''}`}
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