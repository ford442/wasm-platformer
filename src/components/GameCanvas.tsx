import React, { useRef, useEffect, useCallback } from 'react';
import { Renderer } from '../gl/renderer';
import { loadWasmModule, type Game, type InputState, type Box } from '../wasm/loader';

// Import shaders and assets
import vertexShaderSource from '../gl/shaders/tex.vert.glsl?raw';
import fragmentShaderSource from '../gl/shaders/tex.frag.glsl?raw';
import backgroundFragmentSource from '../gl/shaders/background.frag.glsl?raw';
import backgroundVertexSource from '../gl/shaders/background.vert.glsl?raw';

// Asset URLs
const WAZZY_SPRITESHEET_URL = './wazzy_spritesheet.png';
const PLATFORM_TEXTURE_URL = './platform.png';
const BACKGROUND_URL = './background.png';
const MUSIC_URL = './background-music.mp3';

// Sound effect URLs
const JUMP_SFX_URL = './jump.mp3';
const LAND_SFX_URL = './land.mp3';

// ## NEW: Add asset URLs for the new entities ##
const ENEMY_TEXTURE_URL = './enemy.png';
const FLOWER_TEXTURE_URL = './flower.png';
const DOOR_TEXTURE_URL = './door.png';

// Define the component's props
interface Props {
  level: string; // The level data as a JSON string
  onLevelTransition: (nextLevel: string) => void;
  wasmModule: Awaited<ReturnType<typeof loadWasmModule>>;
}

const GameCanvas: React.FC<Props> = ({ wasmModule, level, onLevelTransition }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const gameRef = useRef<Game | null>(null);
  const keysRef = useRef<Record<string, boolean>>({
    'ArrowLeft': false, 'ArrowRight': false, 'Space': false,
  });
  const audioRef = useRef(new Audio(MUSIC_URL));

  // Effect for handling keyboard inputs and starting music
  useEffect(() => {
    const audio = audioRef.current;
    audio.loop = true;

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

  // Main effect for initialization and running the game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !level || !wasmModule) return;

    let animationFrameId: number;

    const initializeAndRun = async () => {
      try {
        // --- 1. Initialization ---
        const renderer = new Renderer(
          canvas,
          vertexShaderSource,
          fragmentShaderSource,
          backgroundVertexSource,
          backgroundFragmentSource
        );
        rendererRef.current = renderer;

        // Load all textures in parallel
        // ## NEW: Load textures for enemies, scenery, and doors ##
        const [
            playerTexture, platformTexture, backgroundTexture,
            enemyTexture, flowerTexture, doorTexture
        ] = await Promise.all([
            renderer.loadTexture(WAZZY_SPRITESHEET_URL),
            renderer.loadTexture(PLATFORM_TEXTURE_URL),
            renderer.loadTexture(BACKGROUND_URL),
            renderer.loadTexture(ENEMY_TEXTURE_URL),
            renderer.loadTexture(FLOWER_TEXTURE_URL),
            renderer.loadTexture(DOOR_TEXTURE_URL),
        ]);
        
        // Initialize the C++ Game instance
        const game = new wasmModule.Game(canvas.width, canvas.height);
        gameRef.current = game;
        
        // Setup sound effects callback
        game.setSoundCallback((soundName: string) => {
          const sfxUrl = soundName === 'jump' ? JUMP_SFX_URL : soundName === 'land' ? LAND_SFX_URL : null;
          if (sfxUrl) new Audio(sfxUrl).play().catch(console.error);
        });

        // Load the first level
        game.loadLevel(level);

        // --- 2. Game Loop ---
        let lastTime = performance.now();
        const gameLoop = (timestamp: number) => {
          if (!game || !renderer) return;

          const deltaTime = (timestamp - lastTime) / 1000.0;
          lastTime = timestamp;

          // Handle user input
          const inputState: InputState = {
            left: keysRef.current['ArrowLeft'],
            right: keysRef.current['ArrowRight'],
            jump: keysRef.current['Space'],
          };
          
          // Update game state in C++
          game.update(JSON.stringify(inputState), deltaTime);
          const gameState = game.getGameState();

          // ## NEW: Check for level transition ##
          if (gameState.level_transition_to) {
            const destination = gameState.level_transition_to;
            onLevelTransition(destination);
            // Stop this loop; the component will re-render with the new level
            return;
          }

          // --- 3. Rendering ---
          renderer.clear();
          renderer.drawBackground(backgroundTexture);

          const camera = game.getCameraPosition();
          renderer.setCamera(camera.x, camera.y);

          // ## NEW: Draw scenery ##
          const scenery = game.getScenery();
          for (let i = 0; i < scenery.size(); i++) {
              // Assuming type 0 is a flower for now
              renderer.drawTexture(scenery.get(i).box, flowerTexture);
          }
          scenery.delete();

          // ## NEW: Draw doors ##
          const doors = game.getDoors();
          for (let i = 0; i < doors.size(); i++) {
              renderer.drawTexture(doors.get(i).box, doorTexture);
          }
          doors.delete();
          
          // Draw platforms
          const platforms = game.getPlatforms();
          for (let i = 0; i < platforms.size(); i++) {
              renderer.drawTexture(platforms.get(i), platformTexture);
          }
          platforms.delete();

          // ## NEW: Draw enemies ##
          const enemies = game.getEnemies();
          for (let i = 0; i < enemies.size(); i++) {
              renderer.drawTexture(enemies.get(i).box, enemyTexture);
          }
          enemies.delete();

          // Draw player
          const player = game.getPlayer();
          renderer.drawPlayer(player, playerTexture);
          player.delete(); // Clean up wasm object
          
          animationFrameId = requestAnimationFrame(gameLoop);
        };
        
        animationFrameId = requestAnimationFrame(gameLoop);

      } catch (error) {
        console.error("Failed to initialize game:", error);
      }
    };

    initializeAndRun();

    return () => {
      // Cleanup on component unmount or re-render
      cancelAnimationFrame(animationFrameId);
      gameRef.current?.delete();
      rendererRef.current?.cleanup();
      audioRef.current.pause();
    };
  }, [level, wasmModule, onLevelTransition]); // Rerun effect if level or wasm module changes

  const canvasStyle: React.CSSProperties = {
    width: '100%', height: '100%', backgroundColor: '#000',
    borderRadius: '8px', boxShadow: '0 0 20px rgba(0, 170, 255, 0.5)',
    border: '2px solid var(--primary-color)'
  };

  return <canvas ref={canvasRef} width={1280} height={720} style={canvasStyle} />;
};

export default GameCanvas;
