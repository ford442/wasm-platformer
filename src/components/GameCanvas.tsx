import React, { useRef, useEffect, useState } from 'react';
import { Renderer } from '../gl/renderer';
import { loadWasmModule, type Game, type InputState, type PlatformList, type Vec2, type Platform } from '../wasm/loader';

// Shaders are imported as raw text
// FIX: Added camera uniform to vertex shader
const vertexShaderSource = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
uniform vec2 u_model_position;
uniform vec2 u_model_size;
uniform vec2 u_camera_position;
out vec2 v_texCoord;

void main() {
  vec2 world_position = (a_position * u_model_size) + u_model_position;
  vec2 view_position = world_position - u_camera_position;
  gl_Position = vec4(view_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}`;

const fragmentShaderSource = `#version 300 es
precision highp float;
in vec2 v_texCoord;
uniform sampler2D u_texture;
out vec4 outColor;

void main() {
  outColor = texture(u_texture, v_texCoord);
}`;

const WAZZY_SPRITE_URL = './wazzy.png';
const PLATFORM_TEXTURE_URL = './platform.png';

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const gameInstanceRef = useRef<Game | null>(null);
  const animationFrameId = useRef<number>(0);
  const keysRef = useRef<Record<string, boolean>>({
    'ArrowLeft': false, 'ArrowRight': false, 'Space': false,
  });

  const [playerTexture, setPlayerTexture] = useState<WebGLTexture | null>(null);
  const [platformTexture, setPlatformTexture] = useState<WebGLTexture | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
 //     try {
        const wasmModule = await loadWasmModule();
        const game = new wasmModule.Game();
        gameInstanceRef.current = game;
        
        const renderer = new Renderer(canvas, vertexShaderSource, fragmentShaderSource);
        rendererRef.current = renderer;

        const [pTex, platTex] = await Promise.all([
          renderer.loadTexture(WAZZY_SPRITE_URL),
          renderer.loadTexture(PLATFORM_TEXTURE_URL)
        ]);
      setPlayerTexture(pTex);
        setPlatformTexture(platTex);

        setIsLoading(false);

        lastTime = performance.now();
        gameLoop(lastTime);
    //  } catch (error) {
   //     console.error("Failed to initialize game:", error);
   //   }
    };

    const gameLoop = (timestamp: number) => {
      if (isLoading || !playerTexture || !platformTexture) {
        animationFrameId.current = requestAnimationFrame(gameLoop);
        return;
      }
      
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
        
        const playerPosition = gameInstance.getPlayerPosition();
        // FIX: Get camera position from C++
        const cameraPosition = gameInstance.getCameraPosition();
        const wasmPlatforms = gameInstance.getPlatforms();
        
        const jsPlatforms: Platform[] = [];
        for (let i = 0; i < wasmPlatforms.size(); i++) {
          jsPlatforms.push(wasmPlatforms.get(i));
        }

        const playerSize = { x: 0.2, y: 0.2 }; 
        
        // FIX: Pass camera position to the renderer
        renderer.drawScene(cameraPosition, playerPosition, playerSize, jsPlatforms, playerTexture, platformTexture);
      }

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    initialize();

    return () => {
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
