import React, { useRef, useEffect } from 'react';
import { Renderer } from '../gl/renderer';
import { loadWasmModule, Game, GameModule } from '../wasm/loader';

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Refs to hold our core engine components
  const rendererRef = useRef<Renderer | null>(null);
  const gameInstanceRef = useRef<Game | null>(null);
  // Ref to hold the ID of the animation frame, so we can cancel it on cleanup
  const animationFrameId = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let lastTime = 0;
    let game: Game; // Hold the game instance locally within the effect

    const initialize = async () => {
      try {
        // 1. Load the WASM module
        const wasmModule: GameModule = await loadWasmModule();

        // 2. Instantiate the C++ Game class
        game = new wasmModule.Game();
        gameInstanceRef.current = game;

        // 3. Initialize our WebGL2 Renderer
        rendererRef.current = new Renderer(canvas);
        
        // 4. Start the game loop
        lastTime = performance.now();
        gameLoop(lastTime);

      } catch (error) {
        console.error("Failed to initialize the game:", error);
      }
    };

    // The core game loop function
    const gameLoop = (timestamp: number) => {
      // Calculate delta time in seconds
      const deltaTime = (timestamp - lastTime) / 1000.0;
      lastTime = timestamp;

      const renderer = rendererRef.current;
      const gameInstance = gameInstanceRef.current;

      if (renderer && gameInstance) {
        // a. Update the game state in C++
        gameInstance.update(deltaTime);

        // b. Get the new position from C++
        const playerPosition = gameInstance.getPlayerPosition();

        // c. Draw the scene with the new position
        renderer.draw(playerPosition);
      }

      // d. Request the next frame
      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    initialize();

    // Cleanup function: This runs when the component is unmounted
    return () => {
      console.log("Cleaning up game resources...");
      // Stop the game loop
      cancelAnimationFrame(animationFrameId.current);
      
      // Important: Free the C++ memory allocated for the game instance
      if (gameInstanceRef.current) {
        gameInstanceRef.current.delete();
      }
    };
  }, []); // Empty dependency array ensures this runs only once

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
