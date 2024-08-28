// theme-toggle.js

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

function setTheme(theme) {
  for (let [property, value] of Object.entries(theme)) {
    document.documentElement.style.setProperty(property, value);
  }
}

function toggleTheme() {
  const isLightMode = document.body.classList.toggle('light-mode');
  const currentTheme = isLightMode ? lightTheme : darkTheme;
  setTheme(currentTheme);
  localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
}

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    setTheme(lightTheme);
    document.body.classList.add('light-mode');
  } else {
    setTheme(darkTheme);
  }
}

export { toggleTheme, initializeTheme };