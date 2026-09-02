import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { useUiStore } from './store/uiStore';

document.documentElement.classList.toggle('light', useUiStore.getState().theme === 'light');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
