// --- File: src/components/GameCanvas.tsx ---
// This component now loads our WASM module and calls a C++ function.
import React, { useRef, useEffect, useState } from 'react';
// We need to create and import our loader
// import { loadWasmModule, GameModule } from '../wasm/loader'; 

// --- Start of loader.ts for self-contained example ---
// In a real project, this would be in a separate file: src/wasm/loader.ts
export interface GameModule {
  getPlayerStartX: () => number;
}
export const loadWasmModule = async (): Promise<GameModule> => {
  const factory = (window as any).createGameModule;
  if (!factory) {
    throw new Error("WASM module factory not found. Did you include game.js in your public folder?");
  }
  const module = await factory();
  return module as GameModule;
};
// --- End of loader.ts ---


const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // State to hold the loaded WASM module instance
  const [wasmModule, setWasmModule] = useState<GameModule | null>(null);
  // State to hold the value returned from C++
  const [playerX, setPlayerX] = useState<number | null>(null);
  // State for loading status
  const [status, setStatus] = useState('Loading WASM...');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Asynchronously load the WASM module
    loadWasmModule()
      .then(module => {
        setWasmModule(module);
        setStatus('WASM Loaded. Calling C++...');
        
        // Call the C++ function through the module
        const startX = module.getPlayerStartX();
        setPlayerX(startX);
        
        setStatus(`C++ returned: ${startX}`);
      })
      .catch(error => {
        console.error("Failed to load WASM module:", error);
        setStatus('Error loading WASM!');
      });

  }, []); // Empty dependency array ensures this runs only once

  // Effect to draw on the canvas when the status changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (context) {
      // Clear canvas
      context.fillStyle = '#000';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Display current status
      context.fillStyle = 'white';
      context.font = '20px Orbitron';
      context.textAlign = 'center';
      context.fillText(status, canvas.width / 2, canvas.height / 2);

      // If we have the player position, draw a simple representation
      if (playerX !== null) {
        context.fillStyle = 'var(--primary-color)';
        context.fillRect(playerX, canvas.height / 2 + 50, 50, 50); // Draw a square for our "player"
      }
    }
  }, [status, playerX]); // Redraw whenever the status or playerX changes

  const canvasStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    borderRadius: '8px',
    boxShadow: '0 0 20px rgba(0, 170, 255, 0.5)',
    border: '2px solid var(--primary-color)'
  };

  return <canvas ref={canvasRef} width={1280} height={720} style={canvasStyle} />;
};


// --- File: src/components/App.tsx ---
// No changes needed here, but included for completeness.
import React from 'react';

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

export default App;
