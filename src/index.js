import React from 'react';
import ReactDOM from 'react-dom';
import './index.css'; // Global styles
import App from './App';
import 'leaflet/dist/leaflet.css'; // Leaflet CSS
import './styles/mapstyles.css'; // Custom map styles

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
