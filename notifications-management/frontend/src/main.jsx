import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const hash = window.location.hash;
if (hash && hash.startsWith('#token=')) {
  const token = hash.substring(7);
  localStorage.setItem('token', token);
  window.history.replaceState({}, '', window.location.pathname + window.location.search);
}

if (!localStorage.getItem('token') && import.meta.env.VITE_DEV_TOKEN) {
  localStorage.setItem('token', import.meta.env.VITE_DEV_TOKEN);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);