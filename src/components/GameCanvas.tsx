
import React, { useRef, useEffect, useState } from 'react';
import { Renderer } from '../gl/renderer';
import { loadWasmModule, type Game, type InputState } from '../wasm/loader';

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const gameInstanceRef = useRef<Game | null>(null);
  const animationFrameId = useRef<number>(0);

  // State to hold the current keyboard inputs
  const [keys, setKeys] = useState<Record<string, boolean>>({
    'ArrowLeft': false,
    'ArrowRight': false,
    'Space': false,
  });

  // Effect to add and remove keyboard event listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code in keys) {
        setKeys(prev => ({ ...prev, [e.code]: true }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code in keys) {
        setKeys(prev => ({ ...prev, [e.code]: false }));
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
    
    const initialize = async () => {
      // ... (Initialization code remains the same)
      try {
        const wasmModule = await loadWasmModule();
        const game = new wasmModule.Game();
        gameInstanceRef.current = game;
        rendererRef.current = new Renderer(canvas);
        lastTime = performance.now();
        gameLoop(lastTime);
      } catch (error) {
        console.error("Failed to initialize the game:", error);
      }
    };

    const gameLoop = (timestamp: number) => {
      const deltaTime = (timestamp - lastTime) / 1000.0;
      lastTime = timestamp;

      const renderer = rendererRef.current;
      const gameInstance = gameInstanceRef.current;

      if (renderer && gameInstance) {
        // 1. Create the input state object from our React state
        const inputState: InputState = {
          left: keys['ArrowLeft'],
          right: keys['ArrowRight'],
          jump: keys['Space'],
        };

        // 2. Send inputs to C++
        gameInstance.handleInput(inputState);

        // 3. Update physics and game logic in C++
        gameInstance.update(deltaTime);
        
        // 4. Get the new position and draw
        const playerPosition = gameInstance.getPlayerPosition();
        renderer.draw(playerPosition);
      }

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    initialize();

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      if (gameInstanceRef.current) {
        gameInstanceRef.current.delete();
      }
    };
  }, []); // Note: The dependency array for the main game loop is still empty

  const canvasStyle: React.CSSProperties = {
    width: '100%', height: '100%', backgroundColor: '#000',
    borderRadius: '8px', boxShadow: '0 0 20px rgba(0, 170, 255, 0.5)',
    border: '2px solid var(--primary-color)'
  };

  return <canvas ref={canvasRef} width={1280} height={720} style={canvasStyle} />;
};

export default GameCanvas;
