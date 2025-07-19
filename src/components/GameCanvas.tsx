import React, { useRef, useEffect, useState } from 'react';
import { Renderer } from '../gl/renderer';
import { loadWasmModule, type Game, type InputState, type PlatformList, type Vec2, type Platform } from '../wasm/loader';
import vertexShaderSource from '../gl/shaders/basic.vert.glsl?raw';
import fragmentShaderSource from '../gl/shaders/basic.frag.glsl?raw';

const WAZZY_SPRITE_URL = './wazzy.png';
const PLATFORM_TEXTURE_URL = './platform.png';

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const gameInstanceRef = useRef<Game | null>(null);
  const keysRef = useRef<Record<string, boolean>>({
    'ArrowLeft': false, 'ArrowRight': false, 'Space': false,
  });
  const playerTextureRef = useRef<WebGLTexture | null>(null);
  const platformTextureRef = useRef<WebGLTexture | null>(null);
  
  // FIX: A state to track when all assets are loaded and we are ready to start the game loop.
  const [isReady, setIsReady] = useState(false);

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

  // FIX: This useEffect handles the one-time setup and asset loading.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const initialize = async () => {
      try {
        const wasmModule = await loadWasmModule();
        const game = new wasmModule.Game();
        gameInstanceRef.current = game;
        
        const renderer = new Renderer(canvas, vertexShaderSource, fragmentShaderSource);
        rendererRef.current = renderer;

        const [pTex, platTex] = await Promise.all([
          renderer.loadTexture(WAZZY_SPRITE_URL),
          renderer.loadTexture(PLATFORM_TEXTURE_URL)
        ]);
        playerTextureRef.current = pTex;
        platformTextureRef.current = platTex;

        // Once everything is loaded, set the ready flag to start the game loop.
        setIsReady(true);
      } catch (error) {
        console.error("Failed to initialize game:", error);
      }
    };

    initialize();

    return () => {
      // Cleanup the C++ game instance when the component unmounts.
      if (gameInstanceRef.current) gameInstanceRef.current.delete();
    };
  }, []);

  // FIX: This useEffect handles the game loop itself. It only runs when 'isReady' becomes true.
  useEffect(() => {
    if (!isReady) return; // Don't start the loop until we are ready.

    let lastTime = performance.now();
    let animationFrameId = 0;
    
    const gameLoop = (timestamp: number) => {
      const renderer = rendererRef.current;
      const gameInstance = gameInstanceRef.current;
      const pTex = playerTextureRef.current;
      const platTex = platformTextureRef.current;

      // This check is still a good safeguard.
      if (!renderer || !gameInstance || !pTex || !platTex) {
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }
      
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
      
      const jsPlatforms: Platform[] = [];
      for (let i = 0; i < wasmPlatforms.size(); i++) {
        jsPlatforms.push(wasmPlatforms.get(i));
      }

      const playerSize = { x: 0.2, y: 0.2 }; 
      
      renderer.drawScene(cameraPosition, playerPosition, playerSize, jsPlatforms, pTex, platTex);

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isReady]); // The dependency array ensures this effect runs when isReady changes.

  const canvasStyle: React.CSSProperties = {
    width: '100%', height: '100%', backgroundColor: '#000',
    borderRadius: '8px', boxShadow: '0 0 20px rgba(0, 170, 255, 0.5)',
    border: '2px solid var(--primary-color)'
  };
  return <canvas ref={canvasRef} width={1280} height={720} style={canvasStyle} />;
};

export default GameCanvas;
