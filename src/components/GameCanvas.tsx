import React, { useRef, useEffect, useState } from 'react';
import { Renderer } from '../gl/renderer';
// FIX: Import the new InputState type
import { loadWasmModule, type Game, type InputState } from '../wasm/loader';

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const gameInstanceRef = useRef<Game | null>(null);
  const animationFrameId = useRef<number>(0);

  const [keys, setKeys] = useState<Record<string, boolean>>({
    'ArrowLeft': false,
    'ArrowRight': false,
    'Space': false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code in keys) setKeys(prev => ({ ...prev, [e.code]: true }));
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code in keys) setKeys(prev => ({ ...prev, [e.code]: false }));
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let lastTime = 0;
    
    const initialize = async () => {
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
        const inputState: InputState = {
          left: keys['ArrowLeft'],
          right: keys['ArrowRight'],
          jump: keys['Space'],
        };
        gameInstance.handleInput(inputState);
        gameInstance.update(deltaTime);
        const playerPosition = gameInstance.getPlayerPosition();
        renderer.draw(playerPosition);
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
