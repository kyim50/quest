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
import CameraComponent from "./components/CameraComponent"; // Import the CameraComponent
import CameraOverlay from "./components/CameraOverlay";

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
              <Route path="/camera" element={<CameraOverlay />} /> {/* Add this route */}
            </Routes>
          </Router>
        </UserProvider>
      </UserStatusProvider>
    </NotificationProvider>
  );
}

export default App;
