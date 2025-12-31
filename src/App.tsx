import React from 'react';
import GameCanvas from './components/GameCanvas';

const App = () => {
  const appStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', padding: '2rem', gap: '1.5rem',
    width: '100%', height: '100vh', boxSizing: 'border-box'
  };
  const headerStyle: React.CSSProperties = {
    fontFamily: 'var(--primary-font)', fontSize: '3rem',
    color: 'var(--primary-color)', textShadow: '0 0 10px var(--primary-color)',
    margin: 0,
  };
  const gameContainerStyle: React.CSSProperties = {
    width: '100%', maxWidth: '1280px', aspectRatio: '16 / 9',
    display: 'flex', justifyContent: 'center', alignItems: 'center',
  };
  const footerStyle: React.CSSProperties = {
    fontFamily: 'var(--primary-font)', fontSize: '1rem',
    color: 'var(--text-color)', opacity: 0.7
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

export default App;
