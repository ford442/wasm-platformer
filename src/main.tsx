import React from 'react';
import ReactDOM from 'react-dom/client';
// Import the main App component from its location in the components folder
import App from './components/App'; 
// Import the global CSS styles
import './index.css';

// This is the standard React 18 entry point.
// It finds the <div id="root"> in index.html and renders the App component into it.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
