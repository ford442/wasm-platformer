import React, { useRef, useEffect, useState } from 'react';
import { Renderer, type BackgroundLayer, type DecorLayers, type DecorItem, type DecorLayerName, type TextureObject } from '../gl/renderer';
import { loadWasmModule, type Game, type InputState, type Platform, type Particle } from '../wasm/loader';
import { AudioManager } from '../audio/AudioManager';
import { DEFAULT_LEVELS, normalizeLevelManifest, resolveLevelEntry, type LevelManifestEntry } from '../lib/levelManifest';

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

type JsonRecord = Record<string, unknown>;
type Vec2 = { x: number; y: number };

type BackgroundLayerConfig = {
  image: string;
  scrollFactorX: number;
  scrollFactorY: number;
  scale: number;
  offsetY: number;
};

type DecorConfig = {
  image: string;
  position: Vec2;
  size: Vec2 | null;
  layer: DecorLayerName;
  parallaxX: number;
  parallaxY: number;
  offsetY: number;
  uv: [number, number, number, number] | null;
};

type LevelData = {
  coreLevel: JsonRecord;
  backgroundLayers: BackgroundLayerConfig[];
  decor: DecorConfig[];
  platformVisualFlags: boolean[];
};

type LevelMetadata = {
  id: string;
  name: string;
  description: string;
  author: string;
};

const DEFAULT_BACKGROUND_LAYER: BackgroundLayerConfig = {
  image: BACKGROUND_URL,
  scrollFactorX: 0.4,
  scrollFactorY: 0.0,
  scale: 1.0,
  offsetY: 0.0,
};

const EMPTY_DECOR_LAYERS: DecorLayers = { distant: [], mid: [], foreground: [] };

const isRecord = (value: unknown): value is JsonRecord => typeof value === 'object' && value !== null;
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isBoolean = (value: unknown): value is boolean => typeof value === 'boolean';
const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const parseVec2 = (value: unknown): Vec2 | null => {
  if (!isRecord(value)) return null;
  const { x, y } = value;
  if (!isFiniteNumber(x) || !isFiniteNumber(y)) return null;
  return { x, y };
};

const parsePlatformArray = (value: unknown): Platform[] => {
  if (!Array.isArray(value)) return [];
  const parsed: Platform[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const position = parseVec2(item.position);
    const size = parseVec2(item.size);
    if (!position || !size) continue;
    parsed.push({ position, size });
  }
  return parsed;
};

const extractBackgroundLayerConfigs = (level: unknown): BackgroundLayerConfig[] => {
  if (!isRecord(level) || !Array.isArray(level.backgroundLayers)) {
    return [DEFAULT_BACKGROUND_LAYER];
  }

  const parsed: BackgroundLayerConfig[] = [];
  for (const layer of level.backgroundLayers) {
    if (!isRecord(layer)) continue;
    const image = typeof layer.image === 'string' ? layer.image.trim() : '';
    if (!image) continue;

    parsed.push({
      image,
      scrollFactorX: isFiniteNumber(layer.scrollFactorX) ? layer.scrollFactorX : DEFAULT_BACKGROUND_LAYER.scrollFactorX,
      scrollFactorY: isFiniteNumber(layer.scrollFactorY) ? layer.scrollFactorY : DEFAULT_BACKGROUND_LAYER.scrollFactorY,
      scale: Math.max(0.01, isFiniteNumber(layer.scale) ? layer.scale : DEFAULT_BACKGROUND_LAYER.scale),
      offsetY: isFiniteNumber(layer.offsetY) ? layer.offsetY : DEFAULT_BACKGROUND_LAYER.offsetY,
    });
  }

  return parsed.length > 0 ? parsed : [DEFAULT_BACKGROUND_LAYER];
};

const parseDecorLayer = (value: unknown): DecorLayerName => {
  if (value === 'distant' || value === 'far') return 'distant';
  if (value === 'foreground' || value === 'front') return 'foreground';
  return 'mid';
};

const parseDecorUV = (value: unknown): [number, number, number, number] | null => {
  if (!Array.isArray(value) || value.length !== 4) return null;
  const [u, v, w, h] = value;
  if (!isFiniteNumber(u) || !isFiniteNumber(v) || !isFiniteNumber(w) || !isFiniteNumber(h)) return null;
  if (w <= 0 || h <= 0) return null;
  return [u, v, w, h];
};

const extractDecorConfigs = (level: unknown): DecorConfig[] => {
  if (!isRecord(level) || !Array.isArray(level.decor)) return [];
  const parsed: DecorConfig[] = [];
  for (const item of level.decor) {
    if (!isRecord(item)) continue;
    const position = parseVec2(item.position);
    if (!position) continue;
    const imageValue = typeof item.image === 'string' ? item.image : (typeof item.texture === 'string' ? item.texture : '');
    const image = imageValue.trim();
    if (!image) continue;
    const size = parseVec2(item.size);
    const parallaxScalar = isFiniteNumber(item.parallaxFactor)
      ? item.parallaxFactor
      : (isFiniteNumber(item.parallax) ? item.parallax : 1.0);
    const parallaxX = isFiniteNumber(item.parallaxX)
      ? item.parallaxX
      : (isFiniteNumber(item.scrollFactorX) ? item.scrollFactorX : parallaxScalar);
    const parallaxY = isFiniteNumber(item.parallaxY)
      ? item.parallaxY
      : (isFiniteNumber(item.scrollFactorY) ? item.scrollFactorY : parallaxScalar);
    parsed.push({
      image,
      position,
      size,
      layer: parseDecorLayer(item.layer),
      parallaxX,
      parallaxY,
      offsetY: isFiniteNumber(item.offsetY) ? item.offsetY : 0.0,
      uv: parseDecorUV(item.uv),
    });
  }
  return parsed;
};

const normalizeLevelData = (level: unknown): LevelData => {
  const fallbackPlatforms = [
    { position: { x: -12.25, y: -2.0 }, size: { x: 110.0, y: 0.2 } },
    { position: { x: 0.0, y: -0.8 }, size: { x: 2.0, y: 0.2 } },
    { position: { x: 2.0, y: -0.6 }, size: { x: 1.0, y: 0.2 } },
    { position: { x: 4.0, y: -0.4 }, size: { x: 1.0, y: 0.2 } },
    { position: { x: 6.0, y: -0.2 }, size: { x: 1.5, y: 0.2 } },
    { position: { x: 8.0, y: 0.2 }, size: { x: 1.0, y: 0.2 } },
    { position: { x: 10.0, y: 0.6 }, size: { x: 1.0, y: 0.2 } },
  ];

  if (!isRecord(level)) {
    return {
      coreLevel: { platforms: fallbackPlatforms },
      backgroundLayers: [DEFAULT_BACKGROUND_LAYER],
      decor: [],
      platformVisualFlags: fallbackPlatforms.map(() => true),
    };
  }

  const coreLevel: JsonRecord = {};
  if (typeof level.name === 'string') coreLevel.name = level.name;
  if (typeof level.description === 'string') coreLevel.description = level.description;
  const spawn = parseVec2(level.spawn);
  if (spawn) coreLevel.spawn = spawn;
  const bounds = isRecord(level.bounds) ? level.bounds : null;
  if (bounds) {
    const min = parseVec2(bounds.min);
    const max = parseVec2(bounds.max);
    if (min && max) coreLevel.bounds = { min, max };
  }
  const camera = isRecord(level.camera) ? level.camera : null;
  if (camera) {
    const cameraOut: JsonRecord = {};
    if (isBoolean(camera.followY)) cameraOut.followY = camera.followY;
    if (isFiniteNumber(camera.verticalDeadzone)) cameraOut.verticalDeadzone = camera.verticalDeadzone;
    if (isFiniteNumber(camera.lookAheadY)) cameraOut.lookAheadY = camera.lookAheadY;
    if (Object.keys(cameraOut).length > 0) coreLevel.camera = cameraOut;
  }

  const sourcePlatforms = Array.isArray(level.platforms) ? level.platforms : [];
  const parsedPlatforms: Platform[] = [];
  const platformVisualFlags: boolean[] = [];
  for (const item of sourcePlatforms) {
    if (!isRecord(item)) continue;
    const position = parseVec2(item.position);
    const size = parseVec2(item.size);
    if (!position || !size) continue;
    parsedPlatforms.push({ position, size });
    platformVisualFlags.push(isBoolean(item.visual) ? item.visual : true);
  }
  const platforms = parsedPlatforms.length > 0 ? parsedPlatforms : fallbackPlatforms;
  coreLevel.platforms = platforms;

  const goals = parsePlatformArray(level.goals);
  if (goals.length > 0) coreLevel.goals = goals;

  return {
    coreLevel,
    backgroundLayers: extractBackgroundLayerConfigs(level),
    decor: extractDecorConfigs(level),
    platformVisualFlags: parsedPlatforms.length > 0 ? platformVisualFlags : fallbackPlatforms.map(() => true),
  };
};


const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysRef = useRef<Record<string, boolean>>({
    'ArrowLeft': false, 'ArrowRight': false, 'Space': false,
    'KeyR': false,  // level reload (one-shot)
    'KeyC': false,  // character switch (Bolts <-> Volts)
    'KeyE': false,  // ability key
  });
  const audioManagerRef = useRef<AudioManager | null>(null);
  const gameInstanceRef = useRef<Game | null>(null);
  const reloadLevelRef = useRef<((targetLevelId?: string, cacheBust?: boolean) => Promise<void>) | null>(null);
  const levelsRef = useRef<LevelManifestEntry[]>(DEFAULT_LEVELS);
  const currentLevelIdRef = useRef<string>(DEFAULT_LEVELS[0].id);
  const [volume, setVolume] = useState(0.5);
  const [levelComplete, setLevelComplete] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const [currentCharacter, setCurrentCharacter] = useState<'BOLTS' | 'VOLTS'>('BOLTS');
  const [availableLevels, setAvailableLevels] = useState<LevelManifestEntry[]>(DEFAULT_LEVELS);
  const [currentLevelId, setCurrentLevelId] = useState<string>(DEFAULT_LEVELS[0].id);
  const [currentLevelMetadata, setCurrentLevelMetadata] = useState<LevelMetadata>({
    id: DEFAULT_LEVELS[0].id,
    name: DEFAULT_LEVELS[0].name ?? DEFAULT_LEVELS[0].id,
    description: '',
    author: '',
  });

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
        void reloadLevelRef.current?.(currentLevelIdRef.current, true);
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

      if (e.code.startsWith('Digit')) {
        const index = Number.parseInt(e.code.replace('Digit', ''), 10) - 1;
        if (index >= 0 && index < levelsRef.current.length) {
          const target = levelsRef.current[index];
          void reloadLevelRef.current?.(target.id, false);
        }
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

        const renderer = new Renderer(canvas, vertexShaderSource, fragmentShaderSource, backgroundVertexSource, backgroundFragmentSource);
        const [playerTexture, platformTexture] = await Promise.all([
          renderer.loadTexture(WAZZY_SPRITESHEET_URL),
          renderer.loadTexture(PLATFORM_TEXTURE_URL),
        ]);

        const backgroundTextureCache = new Map<string, Promise<TextureObject>>();
        const decorTextureCache = new Map<string, Promise<TextureObject>>();
        const loadBackgroundTexture = (url: string): Promise<TextureObject> => {
          const existing = backgroundTextureCache.get(url);
          if (existing) return existing;
          const request = renderer.loadTexture(url, { repeat: true, pixelated: false });
          backgroundTextureCache.set(url, request);
          return request;
        };
        const loadDecorTexture = (url: string): Promise<TextureObject> => {
          const existing = decorTextureCache.get(url);
          if (existing) return existing;
          const request = renderer.loadTexture(url, { repeat: false, pixelated: false });
          decorTextureCache.set(url, request);
          return request;
        };
        const loadBackgroundLayers = async (configs: BackgroundLayerConfig[]): Promise<BackgroundLayer[]> => Promise.all(
          configs.map(async (config) => ({
            texture: await loadBackgroundTexture(config.image),
            scrollFactorX: config.scrollFactorX,
            scrollFactorY: config.scrollFactorY,
            scale: config.scale,
            offsetY: config.offsetY,
          }))
        );

        const loadDecorLayers = async (configs: DecorConfig[]): Promise<DecorLayers> => {
          const loaded = await Promise.all(
            configs.map(async (config): Promise<DecorItem | null> => {
              try {
                const texture = await loadDecorTexture(config.image);
                const uv = config.uv ?? [0, 0, texture.width, texture.height];
                const frameCoord = { x: uv[0], y: uv[1] };
                const frameSize = { x: uv[2], y: uv[3] };
                const size = config.size ?? {
                  x: clamp(frameSize.x / frameSize.y, 0.1, 10.0),
                  y: 1.0,
                };
                return {
                  position: config.position,
                  size: {
                    x: clamp(size.x, 0.1, 20.0),
                    y: clamp(size.y, 0.1, 20.0),
                  },
                  texture,
                  layer: config.layer,
                  parallaxX: config.parallaxX,
                  parallaxY: config.parallaxY,
                  offsetY: config.offsetY,
                  frameCoord,
                  frameSize,
                };
              } catch (error) {
                console.warn(`Failed to load decor texture "${config.image}"`, error);
                return null;
              }
            })
          );

          const layers: DecorLayers = { distant: [], mid: [], foreground: [] };
          for (const item of loaded) {
            if (!item) continue;
            layers[item.layer].push(item);
          }
          return layers;
        };

        let backgroundLayers: BackgroundLayer[] = [];
        let decorLayers: DecorLayers = EMPTY_DECOR_LAYERS;
        let platformVisualFlags: boolean[] = [];
        const getLevelEntry = (targetLevelId?: string): LevelManifestEntry => resolveLevelEntry(levelsRef.current, targetLevelId);
        const loadManifest = async (): Promise<void> => {
          try {
            const response = await fetch('/levels/manifest.json');
            if (!response.ok) {
              levelsRef.current = DEFAULT_LEVELS;
              setAvailableLevels(DEFAULT_LEVELS);
              return;
            }
            const manifestObj: unknown = await response.json();
            const normalized = normalizeLevelManifest(manifestObj);
            levelsRef.current = normalized;
            setAvailableLevels(normalized);
          } catch (error) {
            console.warn('Error loading level manifest, using default:', error);
            levelsRef.current = DEFAULT_LEVELS;
            setAvailableLevels(DEFAULT_LEVELS);
          }
        };
        const loadLevelData = async (targetLevelId?: string, cacheBust: boolean = false) => {
          if (!gameInstance) return;
          const targetLevel = getLevelEntry(targetLevelId);
          currentLevelIdRef.current = targetLevel.id;
          setCurrentLevelId(targetLevel.id);
          const levelUrl = cacheBust
            ? `/levels/${targetLevel.file}?ts=${Date.now()}`
            : `/levels/${targetLevel.file}`;
          try {
            const levelResp = await fetch(levelUrl);
            if (levelResp.ok) {
              const levelObj: unknown = await levelResp.json();
              const normalized = normalizeLevelData(levelObj);
              gameInstance.loadLevel(normalized.coreLevel);
              backgroundLayers = await loadBackgroundLayers(normalized.backgroundLayers);
              decorLayers = await loadDecorLayers(normalized.decor);
              platformVisualFlags = normalized.platformVisualFlags;
              const levelRecord = isRecord(levelObj) ? levelObj : {};
              const resolvedName = gameInstance.getLevelName().trim() || targetLevel.name || targetLevel.id;
              const resolvedDescription = gameInstance.getLevelDescription().trim() || targetLevel.description || '';
              const resolvedAuthor = typeof levelRecord.author === 'string'
                ? levelRecord.author
                : (targetLevel.author ?? '');
              setCurrentLevelMetadata({
                id: targetLevel.id,
                name: resolvedName,
                description: resolvedDescription,
                author: resolvedAuthor,
              });
            } else {
              console.warn('Failed to fetch level JSON:', levelResp.status);
              backgroundLayers = await loadBackgroundLayers([DEFAULT_BACKGROUND_LAYER]);
              decorLayers = EMPTY_DECOR_LAYERS;
              platformVisualFlags = [];
              setCurrentLevelMetadata({
                id: targetLevel.id,
                name: targetLevel.name ?? targetLevel.id,
                description: targetLevel.description ?? '',
                author: targetLevel.author ?? '',
              });
            }
          } catch (err) {
            console.warn('Error loading level JSON:', err);
            backgroundLayers = await loadBackgroundLayers([DEFAULT_BACKGROUND_LAYER]);
            decorLayers = EMPTY_DECOR_LAYERS;
            platformVisualFlags = [];
            setCurrentLevelMetadata({
              id: targetLevel.id,
              name: targetLevel.name ?? targetLevel.id,
              description: targetLevel.description ?? '',
              author: targetLevel.author ?? '',
            });
          }
        };
        await loadManifest();
        await loadLevelData(undefined, false);

        // Reload function for rapid iteration (R key)
        const reloadLevel = async (targetLevelId?: string, cacheBust: boolean = false) => {
          if (!gameInstance) return;
          try {
            await loadLevelData(targetLevelId, cacheBust);
            setLevelComplete(false);
            keysRef.current['KeyR'] = false;
          } catch (e) {
            console.warn('Failed to reload level on R key:', e);
          }
        };
        reloadLevelRef.current = reloadLevel;
        gameInstanceRef.current = gameInstance;
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
          const wasmGoals = gameInstance.getGoals();
          const jsGoals: Platform[] = [];
          for (let i = 0; i < wasmGoals.size(); i++) {
            jsGoals.push(wasmGoals.get(i));
          }

          // Ability state for HUD
          const abilityState = gameInstance.getAbilityState();
          const abilityCooldown = gameInstance.getAbilityCooldownPercent();
          const abilityLabel = currentCharacter === 'BOLTS' ? 'Ground Pound' : 'Hover';
          const abilityStatus = abilityState === 0 ? 'READY' : abilityState === 1 ? 'ACTIVE' : `CD ${Math.ceil(abilityCooldown * 100)}%`;

          setDebugInfo(`[${currentCharacter}] pos: ${playerPosition.x.toFixed(1)},${playerPosition.y.toFixed(1)} | ${abilityLabel}: ${abilityStatus}`);

          const charForRenderer = currentCharacter === 'VOLTS' ? 1 : 0;
          renderer.drawScene(
            cameraPosition,
            playerPosition,
            playerSize,
            jsPlatforms,
            jsParticles,
            playerTexture,
            platformTexture,
            backgroundLayers,
            decorLayers,
            platformVisualFlags,
            playerAnim,
            jsGoals,
            charForRenderer
          );
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
        <select
          value={currentLevelId}
          onChange={(e) => { void reloadLevelRef.current?.(e.target.value, false); }}
          style={{
            background: 'rgba(0,0,0,0.75)',
            color: '#0ff',
            border: '1px solid #0ff',
            borderRadius: '4px',
            padding: '3px 6px',
            fontSize: '12px',
            fontFamily: 'monospace',
          }}
        >
          {availableLevels.map((level, index) => (
            <option key={level.id} value={level.id}>
              {index + 1}. {level.name ?? level.id}
            </option>
          ))}
        </select>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
        />
        <div style={{ fontSize: '11px', opacity: 0.7, fontFamily: 'monospace', color: '#0ff' }}>
          1-9: switch map • R: reload map • C: switch dog • E: ability
        </div>
      </div>
      <div style={{ position: 'absolute', left: '10px', top: '10px', zIndex: 30, color: '#0ff', background: 'rgba(0,0,0,0.6)', padding: '6px', fontFamily: 'monospace', fontSize: '12px', borderRadius: '4px', maxWidth: '45%' }}>
        <div style={{ fontWeight: 700 }}>{currentLevelMetadata.name}</div>
        {currentLevelMetadata.description && (
          <div style={{ opacity: 0.85, marginTop: 2 }}>{currentLevelMetadata.description}</div>
        )}
        {currentLevelMetadata.author && (
          <div style={{ opacity: 0.75, marginTop: 2 }}>by {currentLevelMetadata.author}</div>
        )}
        <div style={{ marginTop: 4 }}>{debugInfo}</div>
      </div>
      <div style={{ position: 'absolute', left: '10px', bottom: '10px', zIndex: 30, color: '#0ff', background: 'rgba(0,0,0,0.6)', padding: '6px', fontFamily: 'monospace', fontSize: '11px', borderRadius: '4px' }}>
        level: {currentLevelMetadata.id} ({currentLevelId})
      </div>
      {levelComplete && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', zIndex: 20
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div>Level Complete!</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => { void reloadLevelRef.current?.(currentLevelId, true); }}
                style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #0ff', background: '#022', color: '#0ff', cursor: 'pointer' }}
              >
                Reload
              </button>
              <button
                type="button"
                onClick={() => {
                  const currentIndex = availableLevels.findIndex((level) => level.id === currentLevelId);
                  const nextLevel = currentIndex >= 0 ? availableLevels[(currentIndex + 1) % availableLevels.length] : undefined;
                  if (nextLevel) {
                    void reloadLevelRef.current?.(nextLevel.id, false);
                  }
                }}
                style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #0ff', background: '#044', color: '#0ff', cursor: 'pointer' }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;
