import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginScreen from "../src/components/LoginScreen";
import RegisterScreen from "../src/components/RegisterScreen";
import HomeScreen from "../src/components/HomeScreen";
import { NotificationProvider } from "./NotificationContext";
import NotificationDisplay from "./NotificationDisplay";
import LandingPage from "./LandingPage";

function App() {
  return (
    <NotificationProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route
            path="/home"
            element={
              <>
                <HomeScreen />
                <NotificationDisplay />
              </>
            }
          />
          <Route
            path="/adventure-feed"
            element={
              <>
                <NotificationDisplay />
              </>
            }
          />
        </Routes>
      </Router>
    </NotificationProvider>
  );
}

export default App;