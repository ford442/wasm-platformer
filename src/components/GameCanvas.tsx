// --- File: src/components/GameCanvas.tsx ---
// This component now loads our WASM module and calls a C++ function.
import React, { useRef, useEffect, useState } from 'react';
// We need to create and import our loader
// import { loadWasmModule, GameModule } from '../wasm/loader'; 
import { Renderer } from '../gl/renderer';

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
  // We use a ref to hold the renderer instance so it persists across re-renders
  // without causing the component to update.
  const rendererRef = useRef<Renderer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas element not found!");
      return;
    }

    // Prevent re-initialization
    if (!rendererRef.current) {
      try {
        // 1. Initialize our WebGL2 Renderer
        rendererRef.current = new Renderer(canvas);
        
        // 2. Perform the initial draw
        rendererRef.current.draw();

        // In the future, we will start a requestAnimationFrame loop here
        // to continuously update and draw the game state.
        console.log("WebGL2 Renderer initialized successfully.");

      } catch (error) {
        console.error("Failed to initialize WebGL2 Renderer:", error);
        // You could display a user-friendly error message on the canvas here
      }
    }

  }, []); // Empty dependency array ensures this runs only once on mount

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
