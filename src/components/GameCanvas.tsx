import React, { useRef, useEffect, useState } from 'react';
import { Renderer, type TextureObject } from '../gl/renderer';
import { loadWasmModule, type Game, type InputState, type PlatformList, type Vec2, type Platform, type AnimationState } from '../wasm/loader';
import vertexShaderSource from '../gl/shaders/basic.vert.glsl?raw';
import fragmentShaderSource from '../gl/shaders/basic.frag.glsl?raw';

const WAZZY_SPRITESHEET_URL = './wazzy_spritesheet.png';
const PLATFORM_TEXTURE_URL = './platform.png';

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const gameInstanceRef = useRef<Game | null>(null);
  // FIX: Use a ref for animationFrameId to allow mutation.
  const animationFrameId = useRef<number>(0);
  const keysRef = useRef<Record<string, boolean>>({
    'ArrowLeft': false, 'ArrowRight': false, 'Space': false,
  });

  const [playerTexture, setPlayerTexture] = useState<TextureObject | null>(null);
  const [platformTexture, setPlatformTexture] = useState<TextureObject | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { /* ... keyboard listeners ... */ }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let lastTime = 0;
    
    const initialize = async () => { /* ... */ };

    const gameLoop = (timestamp: number) => {
      if (isLoading || !playerTexture || !platformTexture) {
        // Use the .current property of the ref
        animationFrameId.current = requestAnimationFrame(gameLoop);
        return;
      }
      
      const deltaTime = (timestamp - lastTime) / 1000.0;
      lastTime = timestamp;

      const renderer = rendererRef.current;
      const gameInstance = gameInstanceRef.current;

      if (renderer && gameInstance) {
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
        
        renderer.drawScene(cameraPosition, playerPosition, playerSize, jsPlatforms, playerTexture, platformTexture, playerAnim);
      }

      // Use the .current property of the ref
      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    initialize();

    return () => {
      // Use the .current property of the ref
      cancelAnimationFrame(animationFrameId.current);
      if (gameInstanceRef.current) gameInstanceRef.current.delete();
    };
  }, [isLoading, playerTexture, platformTexture]);
  
  const canvasStyle: React.CSSProperties = {
    width: '100%', height: '100%', backgroundColor: '#000',
    borderRadius: '8px', boxShadow: '0 0 20px rgba(0, 170, 255, 0.5)',
    border: '2px solid var(--primary-color)'
  };
  return <canvas ref={canvasRef} width={1280} height={720} style={canvasStyle} />;
};

export default GameCanvas;
