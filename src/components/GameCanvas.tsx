import React, { useRef, useEffect } from 'react';
import { Renderer, Platform } from '../gl/renderer'; // Import Platform type for the array
import { loadWasmModule, type Game, type InputState, type PlatformList } from '../wasm/loader';

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const gameInstanceRef = useRef<Game | null>(null);
  const animationFrameId = useRef<number>(0);
  const keysRef = useRef<Record<string, boolean>>({ /* ... no changes ... */ });

  // ... (useEffect for keyboard listeners remains the same) ...

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

    return () => { /* ... no changes ... */ };
  }, []);

  const canvasStyle: React.CSSProperties = { /* ... no changes ... */ };
  return <canvas ref={canvasRef} width={1280} height={720} style={canvasStyle} />;
};

export default GameCanvas;
