import React, { useCallback } from 'react';

const PinterestLayout = React.memo(({ items, onItemClick }) => {
    const getPinSize = useCallback((aspectRatio) => {
      const ratio = aspectRatio.split(':').map(Number);
      if (ratio[0] === ratio[1]) return 'square';
      if (ratio[0] * 3 === ratio[1] * 2) return 'standard';
      if (ratio[0] * 21 === ratio[1] * 10) return 'long';
      return 'standard'; // default to standard if ratio doesn't match
    }, []);
  
    return (
      <div className="pin-container">
        {items.map((item) => {
          const pinSize = getPinSize(item.aspectRatio || '2:3');
          return (
            <div key={item.id} className="pin-item">
              <div className={`card-wrapper pin-${pinSize}`}>
                <div className="card" onClick={() => onItemClick(item)}>
                  <div className="card-image-container">
                    <img 
                      src={item.image} 
                      alt={item.caption || `Photo by ${item.user.name}`} 
                      className="card-image"
                    />
                  </div>
                  <div className="card-content">
                    {item.caption && <p className="card-caption">{item.caption}</p>}
                  </div>
                </div>
              </div>
              <div className="card-user-info">
                <img src={item.user.profilePhoto || '/default-profile-image.jpg'} alt={item.user.name} className="card-user-avatar" />
                <span className="card-username">{item.user.name}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  });

export default PinterestLayout;