const WebSocket = require('ws');
const ws = new WebSocket('wss://example.ngrok.io'); // Replace with your WebSocket URL

ws.on('open', () => {
  console.log('WebSocket connection established');
  ws.send('Hello from client!');
});

ws.on('message', (data) => {
  console.log('Message from server:', data);
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', () => {
  console.log('WebSocket connection closed');
});
