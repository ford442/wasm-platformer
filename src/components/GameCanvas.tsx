import React, { useRef, useEffect, useState } from 'react';
import { Renderer } from '../gl/renderer';
import { loadWasmModule, type Game, type InputState, type Platform, type Particle } from '../wasm/loader';
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



const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Record<string, boolean>>({
    'ArrowLeft': false, 'ArrowRight': false, 'Space': false,
    'KeyR': false,  // level reload (one-shot)
    'KeyC': false,  // character switch (Bolts <-> Volts)
    'KeyE': false,  // ability key
  });
  const audioManagerRef = useRef<AudioManager | null>(null);
  const levelGoalsRef = useRef<Platform[]>([]);
  const gameInstanceRef = useRef<Game | null>(null);
  const reloadLevelRef = useRef<(() => void) | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [levelComplete, setLevelComplete] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [currentCharacter, setCurrentCharacter] = useState<'BOLTS' | 'VOLTS'>('BOLTS');

  useEffect(() => {
    audioManagerRef.current = new AudioManager();
    const audioManager = audioManagerRef.current;
    audioManager.setVolume(volume);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code in keysRef.current) keysRef.current[e.code] = true;
      audioManager.resumeContext();
      audioManager.playMusic();

      // R key: reload current level JSON (great for iterating on map design)
      if (e.code === 'KeyR') {
        reloadLevelRef.current?.();
        keysRef.current['KeyR'] = false;
      }

      // C key: switch between Bolts and Volts
      if (e.code === 'KeyC') {
        const gi = gameInstanceRef.current;
        if (gi) {
          gi.switchCharacter();
          const newChar = gi.getCurrentCharacter() === 1 ? 'VOLTS' : 'BOLTS';
          setCurrentCharacter(newChar);
        }
        keysRef.current['KeyC'] = false;
      }
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

        // Register level complete callback
        gameInstance.setLevelCompleteCallback(() => {
          setLevelComplete(true);
        });

        // Load level JSON
        try {
          const levelResp = await fetch('/levels/test-1.json');
          if (levelResp.ok) {
            const levelObj = await levelResp.json();
            levelGoalsRef.current = Array.isArray(levelObj?.goals)
              ? levelObj.goals.map((g: any) => ({ position: g.position, size: g.size })) as Platform[]
              : [];
            gameInstance.loadLevel(levelObj);
          } else {
            console.warn('Failed to fetch level JSON:', levelResp.status);
          }
        } catch (err) {
          console.warn('Error loading level JSON:', err);
        }

        // Reload function for rapid iteration (R key)
        const reloadLevel = async () => {
          if (!gameInstance) return;
          try {
            const levelResp = await fetch('/levels/test-1.json?ts=' + Date.now());
            if (levelResp.ok) {
              const levelObj = await levelResp.json();
              levelGoalsRef.current = Array.isArray(levelObj?.goals)
                ? levelObj.goals.map((g: any) => ({ position: g.position, size: g.size })) as Platform[]
                : [];
              gameInstance.loadLevel(levelObj);
              setLevelComplete(false);
              keysRef.current['KeyR'] = false;
            }
          } catch (e) {
            console.warn('Failed to reload level on R key:', e);
          }
        };
        reloadLevelRef.current = reloadLevel;
        gameInstanceRef.current = gameInstance;

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
            abilityKey: keysRef.current['KeyE'],
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
          const wasmParticles = gameInstance.getParticles();
          const jsParticles: Particle[] = [];
          for (let i = 0; i < wasmParticles.size(); i++) {
            jsParticles.push(wasmParticles.get(i));
          }

          // Ability state for HUD
          const abilityState = gameInstance.getAbilityState();
          const abilityCooldown = gameInstance.getAbilityCooldownPercent();
          const abilityLabel = currentCharacter === 'BOLTS' ? 'Ground Pound' : 'Hover';
          const abilityStatus = abilityState === 0 ? 'READY' : abilityState === 1 ? 'ACTIVE' : `CD ${Math.ceil(abilityCooldown * 100)}%`;

          setDebugInfo(`[${currentCharacter}] pos: ${playerPosition.x.toFixed(1)},${playerPosition.y.toFixed(1)} | ${abilityLabel}: ${abilityStatus}`);

          const charForRenderer = currentCharacter === 'VOLTS' ? 1 : 0;
          renderer.drawScene(cameraPosition, playerPosition, playerSize, jsPlatforms, jsParticles, playerTexture, platformTexture, backgroundTexture, playerAnim, levelGoalsRef.current, charForRenderer);
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
      reloadLevelRef.current = null;
      gameInstanceRef.current = null;
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
      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
        />
        <div style={{ fontSize: '11px', opacity: 0.7, fontFamily: 'monospace', color: '#0ff' }}>
          R: reload map • C: switch dog • E: ability
        </div>
      </div>
      <div style={{ position: 'absolute', left: '10px', top: '10px', zIndex: 30, color: '#0ff', background: 'rgba(0,0,0,0.6)', padding: '6px', fontFamily: 'monospace', fontSize: '12px', borderRadius: '4px' }}>
        {debugInfo}
      </div>
      {levelComplete && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', zIndex: 20
        }}>
          Level Complete!
        </div>
      )}
    </div>
  );
};

export default GameCanvas;
