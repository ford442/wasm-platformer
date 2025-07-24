import React, { useRef, useEffect } from 'react';
import { Renderer } from '../gl/renderer';
import { loadWasmModule, type Game, type InputState, type Platform } from '../wasm/loader';

// Import assets and shaders
import vertexShaderSource from '../gl/shaders/tex.vert.glsl?raw';
import fragmentShaderSource from '../gl/shaders/tex.frag.glsl?raw';
import backgroundFragmentSource from '../gl/shaders/background.frag.glsl?raw';
import backgroundVertexSource from '../gl/shaders/background.vert.glsl?raw';

const WAZZY_SPRITESHEET_URL = './wazzy_spritesheet.png';
const PLATFORM_TEXTURE_URL = './platform.png';
const BACKGROUND_URL = './background.png';
const MUSIC_URL = './background-music.mp3';
// New: Sound effect URLs
const JUMP_SFX_URL = './jump.mp3';
const LAND_SFX_URL = './land.mp3';

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Record<string, boolean>>({
    'ArrowLeft': false, 'ArrowRight': false, 'Space': false,
  });
  
  const audioRef = useRef(new Audio(MUSIC_URL));

  // New: Refs to hold our loaded sound effect audio objects
  const jumpSfxRef = useRef<HTMLAudioElement | null>(null);
  const landSfxRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    audio.loop = true;

    // New: Preload the sound effects when the component mounts
    jumpSfxRef.current = new Audio(JUMP_SFX_URL);
    landSfxRef.current = new Audio(LAND_SFX_URL);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code in keysRef.current) keysRef.current[e.code] = true;
      if (audio.paused) audio.play().catch(console.error);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code in keysRef.current) keysRef.current[e.code] = false;
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

    let animationFrameId = 0;
    let gameInstance: Game | null = null;
    
    // New: This function will be passed to C++
    const handleSoundEvent = (soundName: string) => {
      let soundToPlay: HTMLAudioElement | null = null;
      if (soundName === 'jump') {
        soundToPlay = jumpSfxRef.current;
      } else if (soundName === 'land') {
        soundToPlay = landSfxRef.current;
      }

      if (soundToPlay) {
        soundToPlay.currentTime = 0; // Rewind to start
        soundToPlay.play().catch(console.error);
      }
    };

    const initializeAndRun = async () => {
      try {
        const wasmModule = await loadWasmModule();
        gameInstance = new wasmModule.Game();
        
        // New: Pass the sound handler function to the C++ game instance
        gameInstance.setSoundCallback(handleSoundEvent);
        
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
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (gameInstance) gameInstance.delete();
      audioRef.current.pause();
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
