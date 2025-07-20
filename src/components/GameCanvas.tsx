import React, { useRef, useEffect } from 'react';
import { Renderer } from '../gl/renderer';
import { loadWasmModule, type Game, type InputState, type PlatformList, type Vec2, type Platform, type AnimationState } from '../wasm/loader';
import vertexShaderSource from '../gl/shaders/basic.vert.glsl?raw';
import fragmentShaderSource from '../gl/shaders/basic.frag.glsl?raw';

const WAZZY_SPRITESHEET_URL = './wazzy.png';
const PLATFORM_TEXTURE_URL = './platform.png';

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Record<string, boolean>>({
    'ArrowLeft': false, 'ArrowRight': false, 'Space': false,
  });

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

    let animationFrameId = 0;
    let gameInstance: Game | null = null;

    const initializeAndRun = async () => {
      try {
        const wasmModule = await loadWasmModule();
        gameInstance = new wasmModule.Game();
        
        const renderer = new Renderer(canvas, vertexShaderSource, fragmentShaderSource);

        const [playerTexture, platformTexture] = await Promise.all([
          renderer.loadTexture(WAZZY_SPRITESHEET_URL),
          renderer.loadTexture(PLATFORM_TEXTURE_URL)
        ]);
          
        // --- Game Loop ---
        let lastTime = performance.now();
        const gameLoop = (timestamp: number) => {
          if (!gameInstance) return; // Exit if game is cleaned up

          const deltaTime = (timestamp - lastTime) / 1000.0;
          lastTime = timestamp;

          const inputState: InputState = {
            left: keysRef.current['ArrowLeft'],
            right: keysRef.current['ArrowRight'],
            jump: keysRef.current['Space'],
          };
          gameInstance.handleInput(inputState);
          gameInstance.update(deltaTime);
          
          const playerPosition = gameInstance.getPlayerPosition();
          const cameraPosition = gameInstance.getCameraPosition();
          const wasmPlatforms = gameInstance.getPlatforms();
          const playerAnim = gameInstance.getPlayerAnimationState();
          
          const jsPlatforms: Platform[] = [];
          for (let i = 0; i < wasmPlatforms.size(); i++) {
            jsPlatforms.push(wasmPlatforms.get(i));
          }

          const playerSize = { x: 0.3, y: 0.3 }; 
          
          renderer.drawScene(cameraPosition, playerPosition, playerSize, jsPlatforms, playerTexture, platformTexture, playerAnim);

          animationFrameId = requestAnimationFrame(gameLoop);
        };
        
        // Start the loop only after everything is loaded.
        animationFrameId = requestAnimationFrame(gameLoop);

      } catch (error) {
        console.error("Failed to initialize game:", error);
      }
    };

    initializeAndRun();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (gameInstance) {
        gameInstance.delete();
      }
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
