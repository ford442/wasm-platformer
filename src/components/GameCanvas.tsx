import React, { useRef, useEffect } from 'react';
// Note: The Renderer and other types are now imported from their respective files.
// This example assumes you have refactored back to a multi-file structure.
import { Renderer, Platform } from '../gl/renderer';
import { loadWasmModule, type Game, type InputState, type PlatformList, type Vec2 } from '../wasm/loader';
import vertexShaderSource from '../gl/shaders/basic.vert.glsl?raw';
import fragmentShaderSource from '../gl/shaders/basic.frag.glsl?raw';


const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const gameInstanceRef = useRef<Game | null>(null);
  const animationFrameId = useRef<number>(0);
  const keysRef = useRef<Record<string, boolean>>({
    'ArrowLeft': false,
    'ArrowRight': false,
    'Space': false,
  });

  // ... (useEffect for keyboard listeners remains the same) ...
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.code in keysRef.current) keysRef.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.code in keysRef.current) keysRef.current[e.code] = false; };
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
        // Pass the shader source code to the renderer constructor
        rendererRef.current = new Renderer(canvas, vertexShaderSource, fragmentShaderSource);
        lastTime = performance.now();
        gameLoop(lastTime);
      } catch (error) {
        console.error("Failed to initialize game:", error);
      }
    };

    const gameLoop = (timestamp: number) => {
      const deltaTime = (timestamp - lastTime) / 1000.0;
      lastTime = timestamp;

      const renderer = rendererRef.current;
      const gameInstance = gameInstanceRef.current;

      if (renderer && gameInstance) {
        const inputState: InputState = {
          left: keysRef.current['ArrowLeft'],
          right: keysRef.current['ArrowRight'],
          jump: keysRef.current['Space'],
        };
        gameInstance.handleInput(inputState);
        gameInstance.update(deltaTime);
        
        // --- Get all game state data from C++ ---
        const playerPosition = gameInstance.getPlayerPosition();
        // NEW: Get the camera position
        const cameraPosition = gameInstance.getCameraPosition();
        const wasmPlatforms = gameInstance.getPlatforms();
        
        const jsPlatforms: Platform[] = [];
        for (let i = 0; i < wasmPlatforms.size(); i++) {
          jsPlatforms.push(wasmPlatforms.get(i));
        }

        const playerSize = { x: 0.2, y: 0.2 }; 
        
        // --- Draw the entire scene with the new camera data ---
        renderer.drawScene(cameraPosition, playerPosition, playerSize, jsPlatforms);
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
