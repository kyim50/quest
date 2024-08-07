// src/LandingPage.js

import React from "react";
import "./LandingPage.css"; // You'll create this file for styling

function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <img src="quests logo.png" alt="Quests Logo" className="logo" />
       
      </header>

      <main className="landing-main">
      <div className ="FirstSection"></div>  
      <div className="headline">
        Connect <div className="Today">Today</div>
      
      <div className="mainheadline">
        Promoting daily connections & making networking easier than ever
      </div>
      <div className="subtext">
        Quests makes networking easy by encouraging you to connect with nearby individuals, helping you build meaningful relationships effortlessly and fostering stronger communities.
      </div>
      <button className="login-button" onClick={() => window.location.href = '/login'}>
          Get Started
        </button>
       </div> 
      </main>
      
      
      <footer className="landing-footer">
        <p>&copy; 2024 Quests. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
