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
        <div className="FirstSection"></div>  
        <div className="headline">
          Connect <div className="Today">Today</div>
        </div>
        <div className="mainheadline">
          Promoting daily connections & making networking easier than ever
        </div>
        <div className="subtext">
          Quests makes networking easy by encouraging you to connect with nearby individuals, helping you build meaningful relationships effortlessly and fostering stronger communities.
        </div>
        <button className="login-button" onClick={() => window.location.href = '/login'}>
          Get Started
        </button>

        
      </main>

      <div className="Functions">
          <div className="Functionsh1">
            Functions
          </div>
          <div className="functions-container">
            <div className="function-box">
              <div className="functionicon">
                <img src="profile_hover.png" alt="profile"></img>
              </div>
              <div className="functionrectheader">
                Create a <span>profile</span>
              </div>
              <div className="functiontext">
              Express yourself and give others insight to who you 
are by uploading a profile photo, creating a bio,
showing your current status and more. You
can choose to make your account public or private
              </div>

            </div>
            <div className="function-box">
              <div className="functionicon">
                <img src="connections_hover.png" alt="connections icon"></img>
              </div>
              <div className="functionrectheader">
                Make a <span>friend</span>
              </div>
              <div className="functiontext">
              You can search for existing users who you 
may know, add someone you went on
a quest with as a friend, view your friend’s profile
and so much more.
              </div>

            </div>
            <div className="function-box">
              <div className="functionicon">
                <img src="quest_hover.png" alt="quests icon"></img>
              </div>
              <div className="functionrectheader">
                Go on a <span>quest</span>
              </div>
              <div className="functiontext">
              Using built in map functions and interactive social
features to allow you to create public or private quests
which you can accept, decline, complete, and view
current quests.   
              </div>

            </div>
            <div className="function-box">
              <div className="functionicon">
                <img src="privacy.png" alt="privacy icon"></img>
              </div>
              <div className="functionrectheader">
                <span>Privacy</span> & <span>Security</span>
              </div>
              <div className="functiontext">
              We ensure you and your data are safe and sound.  
Once your account is private, you wont be seen by 
and cant see people neaby unless they are
a friend. Additionaly there is an <span>SOS</span> feature that alerts
nearby personnel that you are in danger or in need of
help. 
              </div>

            </div>           
            <div className="function-box">
              <div className="functionicon">
                <img src="history_hover.png" alt="history icon"></img>
              </div>
              <div className="functionrectheader">
                <span>History</span>
              </div>
              <div className="functiontext">
              Keep track of previous quests and specific details 
of that quest such as the location, date, time and
who you went on that quest with.  
              </div>

            </div>            
            <div className="function-box">
              <div className="functionicon">
                <img src="feed.png" alt="feed icon"></img>
              </div>
              <div className="functionrectheader">
                Photo <span>Feed</span>
              </div>
              <div className="functiontext">
              Look at pictures from quests your friends 
are currently on and take pictures of your own. Like 
and leave a message on your friends pictures.
              </div>

            </div>          </div>
        </div>
      <footer className="landing-footer">
        <p>&copy; 2024 Quests. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
