document.addEventListener('DOMContentLoaded', function() {
  const contentArea = document.querySelector('.content-area');
  const mapContainer = document.querySelector('.map-container');
  const resizer = document.createElement('div');
  resizer.className = 'resizer';
  
  contentArea.parentNode.insertBefore(resizer, mapContainer);

  let isResizing = false;
  let lastDownX = 0;

  resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    lastDownX = e.clientX;
  });

  document.addEventListener('mousemove', (e) => {
    if (!isResizing) return;

    const offsetRight = document.body.offsetWidth - (e.clientX - document.body.offsetLeft);
    const minWidth = 300;
    const maxWidth = document.body.offsetWidth - 300;

    if (e.clientX < maxWidth && e.clientX > minWidth) {
      contentArea.style.width = `${e.clientX}px`;
      mapContainer.style.width = `${offsetRight}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    isResizing = false;
  });
});
