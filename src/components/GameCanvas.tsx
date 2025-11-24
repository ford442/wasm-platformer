import React, { useRef, useEffect, useState } from 'react';
import { Renderer } from '../gl/renderer';
import { loadWasmModule, type Game, type InputState, type Platform } from '../wasm/loader';
import { AudioManager } from '../audio/AudioManager';

import vertexShaderSource from '../gl/shaders/tex.vert.glsl?raw';
import fragmentShaderSource from '../gl/shaders/tex.frag.glsl?raw';
import backgroundFragmentSource from '../gl/shaders/background.frag.glsl?raw';
import backgroundVertexSource from '../gl/shaders/background.vert.glsl?raw';

const WAZZY_SPRITESHEET_URL = './wazzy_spritesheet.png';
const PLATFORM_TEXTURE_URL = './platform.png';
const BACKGROUND_URL = './background.png';
const MUSIC_URL = './background-music.mp3';
const JUMP_SFX_URL = './jump.mp3';
const LAND_SFX_URL = './land.mp3';

const ANIMATION_OFFSETS: Record<string, number> = {
  idle: 0.1875,
  run: 0.1875,
  jump: 0.1,
};

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Record<string, boolean>>({
    'ArrowLeft': false, 'ArrowRight': false, 'Space': false,
  });
  const audioManagerRef = useRef<AudioManager | null>(null);
  const [volume, setVolume] = useState(0.5);

  useEffect(() => {
    audioManagerRef.current = new AudioManager();
    const audioManager = audioManagerRef.current;
    audioManager.setVolume(volume);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code in keysRef.current) keysRef.current[e.code] = true;
      audioManager.resumeContext();
      audioManager.playMusic();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code in keysRef.current) keysRef.current[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      audioManager.stopMusic();
    };
  }, [volume]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let animationFrameId = 0;
    let gameInstance: Game | null = null;
    const audioManager = audioManagerRef.current!;

    const handleSoundEvent = (soundName: string) => {
      audioManager.playSfx(soundName);
    };

    const initializeAndRun = async () => {
      try {
        await Promise.all([
          audioManager.loadSfx('jump', JUMP_SFX_URL),
          audioManager.loadSfx('land', LAND_SFX_URL),
          audioManager.loadMusic(MUSIC_URL)
        ]);

        const wasmModule = await loadWasmModule();
        gameInstance = new wasmModule.Game();
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
          // Apply a visual offset to the player position to fix the hovering issue.
          // The sprite has some empty space at the bottom, so we shift it down slightly.
          // We use dynamic offsets because the padding differs between animation states.
          const offset = ANIMATION_OFFSETS[playerAnim.currentState] ?? 0.1;
          const visualPlayerPos = { x: playerPosition.x, y: playerPosition.y - offset };
          renderer.drawScene(cameraPosition, visualPlayerPos, playerSize, jsPlatforms, playerTexture, platformTexture, backgroundTexture, playerAnim);
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
    };
  }, []);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioManagerRef.current) {
      audioManagerRef.current.setVolume(newVolume);
    }
  };

  const canvasStyle: React.CSSProperties = {
    width: '100%', height: '100%', backgroundColor: '#000',
    borderRadius: '8px', boxShadow: '0 0 20px rgba(0, 170, 255, 0.5)',
    border: '2px solid var(--primary-color)'
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} width={1280} height={720} style={canvasStyle} />
      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
        />
      </div>
    </div>
  );
};

export default GameCanvas;
