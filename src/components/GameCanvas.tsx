import React, { useRef, useEffect, useState } from 'react';
// FIX: Import TextureObject from the renderer file.
import { Renderer, type TextureObject } from '../gl/renderer';
import { loadWasmModule, type Game, type InputState, type PlatformList, type Vec2, type Platform, type AnimationState } from '../wasm/loader';

import vertexShaderSource from '../gl/shaders/tex.vert.glsl?raw';
import fragmentShaderSource from '../gl/shaders/tex.frag.glsl?raw';
import backgroundFragmentSource from '../gl/shaders/background.frag.glsl?raw';
import backgroundVertexSource from '../gl/shaders/background.vert.glsl?raw';
const WAZZY_SPRITESHEET_URL = './wazzy_spritesheet.png';
const PLATFORM_TEXTURE_URL = './platform.png';
const BACKGROUND_URL = './background.png'; // NEW

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Record<string, boolean>>({
    'ArrowLeft': false, 'ArrowRight': false, 'Space': false,
  });

  // This useEffect handles keyboard input listeners.
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

  // FIX: This single, robust useEffect handles the entire game lifecycle.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationFrameId = 0;
    let gameInstance: Game | null = null;
    
    const initializeAndRun = async () => {
      try {
        const wasmModule = await loadWasmModule();
        gameInstance = new wasmModule.Game();
        
        const renderer = new Renderer(canvas, vertexShaderSource, fragmentShaderSource, backgroundVertexSource, backgroundFragmentSource);

        const [playerTexture, platformTexture, backgroundTexture] = await Promise.all([
          renderer.loadTexture(WAZZY_SPRITESHEET_URL),
          renderer.loadTexture(PLATFORM_TEXTURE_URL),
          renderer.loadTexture(BACKGROUND_URL) // Load the new texture
        ]);
        
        let lastTime = performance.now();
        const gameLoop = (timestamp: number) => {
          if (!gameInstance) return;

          const deltaTime = (timestamp - lastTime) / 1000.0;
          lastTime = timestamp;

          const inputState: InputState = { /* ... */ };
          gameInstance.handleInput(inputState);
          gameInstance.update(deltaTime);
          
          const playerPosition = gameInstance.getPlayerPosition();
          const cameraPosition = gameInstance.getCameraPosition();
          const wasmPlatforms = gameInstance.getPlatforms();
          const playerAnim = gameInstance.getPlayerAnimationState();
          const playerSize = gameInstance.getPlayerSize();
          
          const jsPlatforms: Platform[] = [];
          for (let i = 0; i < wasmPlatforms.size(); i++) {
            jsPlatforms.push(wasmPlatforms.get(i));
          }
          
          // Pass the new background texture to the renderer
          renderer.drawScene(cameraPosition, playerPosition, playerSize, jsPlatforms, playerTexture, platformTexture, backgroundTexture, playerAnim);

          animationFrameId = requestAnimationFrame(gameLoop);
        };
        
        animationFrameId = requestAnimationFrame(gameLoop);

      } catch (error) {
        console.error("Failed to initialize game:", error);
      }
    };

    initializeAndRun();

    // Cleanup function that runs when the component unmounts.
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (gameInstance) {
        gameInstance.delete();
      }
    };
  }, []); // The empty dependency array ensures this runs only once.

  const canvasStyle: React.CSSProperties = {
    width: '100%', height: '100%', backgroundColor: '#000',
    borderRadius: '8px', boxShadow: '0 0 20px rgba(0, 170, 255, 0.5)',
    border: '2px solid var(--primary-color)'
  };
  return <canvas ref={canvasRef} width={1280} height={720} style={canvasStyle} />;
};

export default GameCanvas;

