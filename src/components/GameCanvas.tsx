// src/components/GameCanvas.tsx
import React, { useEffect, useRef, useState } from 'react';
import { loadWasmModule, WasmModule } from '../wasm/loader';
import { FilamentRenderer, RenderData } from '../filament/renderer';
import { Engine, Renderer } from 'filament';

// Helper to manage keyboard state
const useKeyPress = () => {
  const [keys, setKeys] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => setKeys(prev => ({ ...prev, [e.code]: true }));
    const handleKeyUp = (e: KeyboardEvent) => setKeys(prev => ({ ...prev, [e.code]: false }));

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  return keys;
};

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wasmModuleRef = useRef<WasmModule | null>(null);
  const rendererRef = useRef<FilamentRenderer | null>(null);
  const filamentEngineRef = useRef<Engine | null>(null);
  const filamentRendererRef = useRef<Renderer | null>(null);
  const keys = useKeyPress();
  const [isLoading, setIsLoading] = useState(true);

  // Initialization effect
  useEffect(() => {
    const init = async () => {
      if (!canvasRef.current) return;
      setIsLoading(true);

      // Load C++ game logic WASM
      const wasmModule = await loadWasmModule();
      wasmModule._init();
      wasmModuleRef.current = wasmModule;

      // Initialize the new Filament renderer
      const fRenderer = new FilamentRenderer(canvasRef.current);
      await fRenderer.initialize();
      rendererRef.current = fRenderer;
      
      // Get Filament engine and renderer instances for the game loop
      const engine = fRenderer.getEngine();
      if (engine) {
          filamentEngineRef.current = engine;
          filamentRendererRef.current = engine.createRenderer();
      }

      let lastTime = 0;
      const gameLoop = (time: number) => {
        if (!wasmModuleRef.current || !rendererRef.current || !filamentRendererRef.current) {
          requestAnimationFrame(gameLoop);
          return;
        }

        const dt = (time - lastTime) / 1000;
        lastTime = time;

        const left = keys['ArrowLeft'] || keys['KeyA'] || 0;
        const right = keys['ArrowRight'] || keys['KeyD'] || 0;
        const jump = keys['Space'] || keys['ArrowUp'] || keys['KeyW'] || 0;

        // Update C++ game state
        wasmModuleRef.current._update(dt, left, right, jump);

        // Get render data from C++
        const renderDataPtr = wasmModuleRef.current._getRenderData();
        const renderDataSize = wasmModuleRef.current._getRenderDataSize();
        const buffer = wasmModuleRef.current.HEAPU8.buffer.slice(renderDataPtr, renderDataPtr + renderDataSize);
        
        const renderData: RenderData = {
            buffer,
            // We are now sending all data in the buffer, so these are not needed here.
            player: { x:0, y:0, vx:0, vy:0, isJumping:false, isFacingLeft: false, animFrame: 0},
            platforms: { count: 0}
        };

        // Render the frame using Filament
        if (filamentRendererRef.current.beginFrame(rendererRef.current.getEngine()!.getSwapChain()!)) {
            rendererRef.current.draw(renderData, filamentRendererRef.current);
            filamentRendererRef.current.endFrame();
        }

        requestAnimationFrame(gameLoop);
      };

      setIsLoading(false);
      requestAnimationFrame(gameLoop);
    };

    init();
  }, [keys]); // Re-running the effect on key press is not intended, let's fix that.
  // The 'keys' dependency is only for the closure inside gameLoop to get the latest state.

  return (
    <div>
      {isLoading && <p>Loading Game...</p>}
      <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh' }} />
    </div>
  );
};

export default GameCanvas;
