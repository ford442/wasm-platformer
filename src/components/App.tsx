import React from 'react';
// We need to import GameCanvas to use it
// import GameCanvas from './GameCanvas'; // This line is commented out as GameCanvas is in the same file for this example

const App = () => {
  const appStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    gap: '1.5rem',
    width: '100%',
    height: '100vh',
    boxSizing: 'border-box'
  };

  const headerStyle: React.CSSProperties = {
      fontFamily: 'var(--primary-font)',
      fontSize: '3rem',
      color: 'var(--primary-color)',
      textShadow: '0 0 10px var(--primary-color)',
      margin: 0,
  };

  const gameContainerStyle: React.CSSProperties = {
      width: '100%',
      maxWidth: '1280px',
      aspectRatio: '16 / 9',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
  };

  const footerStyle: React.CSSProperties = {
      fontFamily: 'var(--primary-font)',
      fontSize: '1rem',
      color: 'var(--text-color)',
      opacity: 0.7
  };

  return (
    <div style={appStyle}>
      <h1 style={headerStyle}>WASM-Venture</h1>
      <div style={gameContainerStyle}>
        <GameCanvas />
      </div>
      <p style={footerStyle}>Powered by C++, WebAssembly, React, and WebGL2</p>
    </div>
  );
};

// --- This would be your `src/index.tsx` ---
// For this self-contained example, we just export the App component.
// In a real project, you'd have:
//
// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import App from './components/App';
// import './index.css';
//
// ReactDOM.createRoot(document.getElementById('root')!).render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
// )

export default App;
