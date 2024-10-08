import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LoginScreen from "./components/LoginScreen";
import RegisterScreen from "./components/RegisterScreen";
import HomeScreen from "./components/HomeScreen";
import { NotificationProvider } from "./NotificationContext";
import NotificationDisplay from "./NotificationDisplay";
import LandingPage from "./LandingPage";
import { initializeTheme } from "./theme-toggle";
import { UserStatusProvider } from "./components/UserStatusContext";
import MainPage from "./pages/MainPage";
import { UserProvider } from "./components/UserProvider"; // Import the UserProvider
import './index.css'

function App() {
  useEffect(() => {
    initializeTheme();
  }, []);

  return (
    <NotificationProvider>
      <UserStatusProvider>
        <UserProvider> {/* Wrap the entire app with UserProvider */}
          <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginScreen />} />
              <Route path="/register" element={<RegisterScreen />} />
              <Route
                path="/home/*"
                element={
                  <>
                    <MainPage />
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
        </UserProvider>
      </UserStatusProvider>
    </NotificationProvider>
  );
}

export default App;