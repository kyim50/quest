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
    '--background-color': '#ffffff',
    '--text-color': '#333333',
    '--accent-color': '#3c68c6',
    '--nav-background': '#f5f5f5',
    '--card-background': '#ffffff',
    '--hover-color': '#e0e0e0',
    '--border-color': '#dddddd',
  };
  
  function setTheme(theme) {
    for (let [property, value] of Object.entries(theme)) {
      document.documentElement.style.setProperty(property, value);
    }
  }
  
  function toggleTheme() {
    const currentTheme = document.body.classList.contains('light-mode') ? darkTheme : lightTheme;
    setTheme(currentTheme);
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
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