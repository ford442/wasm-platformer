import React, { useRef, useEffect } from 'react';
import { Renderer, Platform } from '../gl/renderer'; // Import Platform type for the array
import { loadWasmModule, type Game, type InputState, type PlatformList } from '../wasm/loader';

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const gameInstanceRef = useRef<Game | null>(null);
  const animationFrameId = useRef<number>(0);
  const keysRef = useRef<Record<string, boolean>>({ /* ... no changes ... */ });


  // FIX: Use a ref to store input state.
  // This avoids issues with stale state in the game loop's closure.
  const keysRef = useRef<Record<string, boolean>>({
    'ArrowLeft': false,
    'ArrowRight': false,
    'Space': false,
  });

  // Effect to add and remove keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code in keysRef.current) {
        keysRef.current[e.code] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code in keysRef.current) {
        keysRef.current[e.code] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Cleanup function
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []); // Empty dependency array means this effect runs once on mount

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let lastTime = 0;
    
    const initialize = async () => { /* ... no changes ... */ };

    const gameLoop = (timestamp: number) => {
      const deltaTime = (timestamp - lastTime) / 1000.0;
      lastTime = timestamp;

      const renderer = rendererRef.current;
      const gameInstance = gameInstanceRef.current;

      if (renderer && gameInstance) {
        const inputState: InputState = { /* ... no changes ... */ };
        gameInstance.handleInput(inputState);
        gameInstance.update(deltaTime);
        
        // --- Get all game state data from C++ ---
        const playerPosition = gameInstance.getPlayerPosition();
        const wasmPlatforms: PlatformList = gameInstance.getPlatforms();
        
        // Convert the Emscripten vector to a standard JavaScript array
        const jsPlatforms: Platform[] = [];
        for (let i = 0; i < wasmPlatforms.size(); i++) {
          jsPlatforms.push(wasmPlatforms.get(i));
        }

        // We need the player's size for rendering, which is hardcoded for now
        const playerSize = { x: 0.2, y: 0.2 }; 
        
        // --- Draw the entire scene ---
        renderer.drawScene(playerPosition, playerSize, jsPlatforms);
      }

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    initialize();

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      if (gameInstanceRef.current) gameInstanceRef.current.delete();
    };
  }, []);

  const canvasStyle: React.CSSProperties = {
    width: '100%', height: '100%', backgroundColor: '#000',
    borderRadius: '8px', boxShadow: '0 0 20px rgba(0, 170, 255, 0.5)',
    border: '2px solid var(--primary-color)'
  };

  return <canvas ref={canvasRef} width={1280} height={720} style={canvasStyle} />;
};

export default GameCanvas;
