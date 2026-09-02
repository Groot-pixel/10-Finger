import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';
import { useUiStore } from './store/uiStore';

// Theme früh anwenden, bevor React rendert (verhindert Flackern)
document.documentElement.classList.toggle('light', useUiStore.getState().theme === 'light');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* Offline-Cache ist ein Bonus-Feature, Fehler hier sind unkritisch */
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
