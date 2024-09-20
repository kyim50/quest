import React from "react";
import "./LandingPage.css";

function LandingPage() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <img src="Quests Logo.png" alt="Quests Logo" className="logo" />
      </header>

      <main className="landing-main">
        <div className="headline">
          Connect <span className="Today">Today</span>
        </div>
        <h1 className="mainheadline">
          Promoting daily connections & making networking easier than ever
        </h1>
        <p className="subtext">
          Quests makes networking easy by encouraging you to connect with nearby individuals, helping you build meaningful relationships effortlessly and fostering stronger communities.
        </p>
        <button className="login-button" onClick={() => window.location.href = '/login'}>
          Get Started
        </button>
      </main>

      <section className="Functions">
        <h2 className="Functionsh1">Functions</h2>
        <div className="functions-container">
          {[
            {
              icon: "profile_hover.png",
              title: "Create a profile",
              text: "Express yourself and give others insight to who you are by uploading a profile photo, creating a bio, showing your current status and more. You can choose to make your account public or private"
            },
            {
              icon: "connections_hover.png",
              title: "Make a friend",
              text: "You can search for existing users who you may know, add someone you went on a quest with as a friend, view your friend's profile and so much more."
            },
            {
              icon: "quest_hover.png",
              title: "Go on a quest",
              text: "Using built in map functions and interactive social features to allow you to create public or private quests which you can accept, decline, complete, and view current quests."
            },
            {
              icon: "privacy.png",
              title: "Privacy & Security",
              text: "We ensure you and your data are safe and sound. Once your account is private, you won't be seen by and can't see people nearby unless they are a friend. Additionally, there is an SOS feature that alerts nearby personnel that you are in danger or in need of help."
            },
            {
              icon: "history_hover.png",
              title: "History",
              text: "Keep track of previous quests and specific details of that quest such as the location, date, time and who you went on that quest with."
            },
            {
              icon: "feed.png",
              title: "Photo Feed",
              text: "Look at pictures from quests your friends are currently on and take pictures of your own. Like and leave a message on your friends' pictures."
            }
          ].map((item, index) => (
            <div className="function-box" key={index}>
              <div className="functionicon">
                <img src={item.icon} alt={item.title} />
              </div>
              <div className="functionrectheader">
                {item.title.split(' ').map((word, i) => 
                  i === item.title.split(' ').length - 1 ? <span key={i}>{word}</span> : word + ' '
                )}
              </div>
              <div className="functiontext">{item.text}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="landing-footer">
        <p>&copy; 2024 Quests. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default LandingPage;