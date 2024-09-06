// theme-toggle.js

import mapboxgl from 'mapbox-gl';

const darkTheme = {
  '--background-color': '#1e1e2e',
  '--text-color': '#ffffff',
  '--accent-color': '#3c68c6',
  '--nav-background': '#1a1a1a',
  '--card-background': '#2c2c2c',
  '--hover-color': '#3a3a3a',
  '--border-color': '#333333',
};

const lightTheme = {
  '--background-color': '#f5f5f5',
  '--text-color': '#333333',
  '--accent-color': '#3c68c6',
  '--nav-background': '#ffffff',
  '--card-background': '#ffffff',
  '--hover-color': '#e0e0e0',
  '--border-color': '#e0e0e0',
};

const darkMapStyle = 'mapbox://styles/mapbox/dark-v10';
const lightMapStyle = 'mapbox://styles/mapbox/light-v10';

function setTheme(theme) {
  for (let [property, value] of Object.entries(theme)) {
    document.documentElement.style.setProperty(property, value);
  }
}

function updateMapStyle(map, isLightMode) {
  if (map && map.setStyle) {
    map.setStyle(isLightMode ? lightMapStyle : darkMapStyle);
  }
}

export function toggleTheme() {
  const isLightMode = document.body.classList.toggle('light-mode');
  const currentTheme = isLightMode ? lightTheme : darkTheme;
  setTheme(currentTheme);
  localStorage.setItem('theme', isLightMode ? 'light' : 'dark');

  // Update MapBox style
  const map = window.currentMap; // Assuming you've stored the map instance globally
  updateMapStyle(map, isLightMode);

  // Dispatch a custom event for other components to react to theme changes
  window.dispatchEvent(new CustomEvent('themeChanged', { detail: { isLightMode } }));
}

export function initializeTheme() {
  const savedTheme = localStorage.getItem('theme');
  const isLightMode = savedTheme === 'light';
  if (isLightMode) {
    setTheme(lightTheme);
    document.body.classList.add('light-mode');
  } else {
    setTheme(darkTheme);
  }

  // Initialize MapBox style
  const map = window.currentMap; // Assuming you've stored the map instance globally
  updateMapStyle(map, isLightMode);
}

// Function to get current theme
export function getCurrentTheme() {
  return document.body.classList.contains('light-mode') ? 'light' : 'dark';
}

// Function to set theme
export function setThemeMode(mode) {
  if (mode === 'light') {
    document.body.classList.add('light-mode');
    setTheme(lightTheme);
  } else {
    document.body.classList.remove('light-mode');
    setTheme(darkTheme);
  }
  localStorage.setItem('theme', mode);

  // Update MapBox style
  const map = window.currentMap;
  updateMapStyle(map, mode === 'light');

  // Dispatch a custom event for other components to react to theme changes
  window.dispatchEvent(new CustomEvent('themeChanged', { detail: { isLightMode: mode === 'light' } }));
}