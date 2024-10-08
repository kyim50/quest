import React, { createContext, useContext, useState } from 'react';

const MapContext = createContext();
const RouteContext = createContext();

export const MapProvider = ({ children, map }) => {
  const [route, setRoute] = useState(null);

  return (
    <MapContext.Provider value={map}>
      <RouteContext.Provider value={{ route, setRoute }}>
        {children}
      </RouteContext.Provider>
    </MapContext.Provider>
  );
};

export const useMap = () => {
  return useContext(MapContext);
};

export const useRoute = () => {
  return useContext(RouteContext);
};