import React, { useRef, useEffect } from 'react';
import { Renderer, type TextureObject } from '../gl/renderer';
import { loadWasmModule, type Game, type InputState, type Platform } from '../wasm/loader';

// Import shader and asset URLs
import vertexShaderSource from '../gl/shaders/tex.vert.glsl?raw';
import fragmentShaderSource from '../gl/shaders/tex.frag.glsl?raw';
import backgroundFragmentSource from '../gl/shaders/background.frag.glsl?raw';
import backgroundVertexSource from '../gl/shaders/background.vert.glsl?raw';

const WAZZY_SPRITESHEET_URL = './wazzy_spritesheet.png';
const PLATFORM_TEXTURE_URL = './platform.png';
const BACKGROUND_URL = './background.png';
// New: Define the path to your music file
const MUSIC_URL = './background-music.mp3';

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Record<string, boolean>>({
    'ArrowLeft': false, 'ArrowRight': false, 'Space': false,
  });
  
  // New: Refs to manage the audio element and its playback state
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicStartedRef = useRef(false);

  // --- Input Handling Effect ---
  useEffect(() => {
    // This function now handles starting the music on the first keydown event.
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code in keysRef.current) {
        keysRef.current[e.code] = true;
      }
      
      // On the first user key press, play the music.
      // Browsers require user interaction to start audio.
      if (audioRef.current && !musicStartedRef.current) {
        audioRef.current.play().catch(error => {
          // Log any errors, e.g., if the browser blocks playback.
          console.error("Audio playback failed:", error);
        });
        musicStartedRef.current = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code in keysRef.current) {
        keysRef.current[e.code] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []); // Note: The dependency array is empty, this runs once.

  // --- Game Initialization and Loop Effect ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationFrameId = 0;
    let gameInstance: Game | null = null;
    
    // New: Create and configure the Audio object when the component mounts.
    // We store it in a ref to access it in the keydown handler.
    audioRef.current = new Audio(MUSIC_URL);
    audioRef.current.loop = true; // Make the music loop continuously.

    const initializeAndRun = async () => {
      try {
        const wasmModule = await loadWasmModule();
        gameInstance = new wasmModule.Game();
        
        const renderer = new Renderer(canvas, vertexShaderSource, fragmentShaderSource, backgroundVertexSource, backgroundFragmentSource);

        const [playerTexture, platformTexture, backgroundTexture] = await Promise.all([
          renderer.loadTexture(WAZZY_SPRITESHEET_URL),
          renderer.loadTexture(PLATFORM_TEXTURE_URL),
          renderer.loadTexture(BACKGROUND_URL)
        ]);
        
        let lastTime = performance.now();
        const gameLoop = (timestamp: number) => {
          if (!gameInstance) return;

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
          const playerSize = gameInstance.getPlayerSize();
          
          const jsPlatforms: Platform[] = [];
          for (let i = 0; i < wasmPlatforms.size(); i++) {
            jsPlatforms.push(wasmPlatforms.get(i));
          }
          
          renderer.drawScene(cameraPosition, playerPosition, playerSize, jsPlatforms, playerTexture, platformTexture, backgroundTexture, playerAnim);

          animationFrameId = requestAnimationFrame(gameLoop);
        };
        
        animationFrameId = requestAnimationFrame(gameLoop);

      } catch (error) {
        console.error("Failed to initialize game:", error);
      }
    };

    initializeAndRun();

    // Cleanup function when the component unmounts
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (gameInstance) {
        gameInstance.delete();
      }
      // New: Stop and clean up the audio to prevent memory leaks.
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
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
