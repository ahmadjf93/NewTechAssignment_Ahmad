import React from 'react';
import ReactDOM from 'react-dom/client';
import '@newtech/theme';
import App from './App';
import './styles.css';

// Mount the React app into the root DOM element.
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
