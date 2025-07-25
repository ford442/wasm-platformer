// src/components/GameCanvas.tsx
import React, { useEffect, useRef, useState } from 'react';
import { loadWasmModule, GameModule } from '../wasm/loader'; // Corrected import
import { FilamentRenderer, RenderData } from '../filament/renderer';
import { Engine, Renderer } from 'filament';

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
  const wasmModuleRef = useRef<GameModule | null>(null); // Use GameModule
  const rendererRef = useRef<FilamentRenderer | null>(null);
  const filamentEngineRef = useRef<Engine | null>(null);
  const filamentRendererRef = useRef<Renderer | null>(null);
  const keysPressed = useKeyPress();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!canvasRef.current) return;
      setIsLoading(true);

      const wasmModule = await loadWasmModule();
      // wasmModule._init(); // This method does not exist on GameModule
      wasmModuleRef.current = wasmModule;

      const fRenderer = new FilamentRenderer(canvasRef.current);
      await fRenderer.initialize();
      rendererRef.current = fRenderer;
      
      const engine = fRenderer.getEngine();
      if (engine) {
          filamentEngineRef.current = engine;
          filamentRendererRef.current = engine.createRenderer();
      }

      let lastTime = 0;
      const gameLoop = (time: number) => {
        if (!wasmModuleRef.current || !rendererRef.current || !filamentRendererRef.current || !filamentEngineRef.current) {
          requestAnimationFrame(gameLoop);
          return;
        }

        const dt = (time - lastTime) / 1000;
        lastTime = time;

        const left = keysPressed['ArrowLeft'] || keysPressed['KeyA'] || 0;
        const right = keysPressed['ArrowRight'] || keysPressed['KeyD'] || 0;
        const jump = keysPressed['Space'] || keysPressed['ArrowUp'] || keysPressed['KeyW'] || 0;

        wasmModuleRef.current._update(dt, left, right, jump);

        const renderDataPtr = wasmModuleRef.current._getRenderData();
        const renderDataSize = wasmModuleRef.current._getRenderDataSize();
        const buffer = wasmModuleRef.current.HEAPU8.buffer.slice(renderDataPtr, renderDataPtr + renderDataSize);
        
        const renderData: RenderData = { buffer };
        
        // The swapChain is now retrieved directly from the engine
        if (filamentRendererRef.current.beginFrame(filamentEngineRef.current.getSwapChain()!)) {
            rendererRef.current.draw(renderData, filamentRendererRef.current);
            filamentRendererRef.current.endFrame();
        }

        requestAnimationFrame(gameLoop);
      };

      setIsLoading(false);
      requestAnimationFrame(gameLoop);
    };

    init().catch(err => {
        console.error("Initialization failed:", err);
        setIsLoading(false);
    });
  }, []); 

  return (
    <div>
      {isLoading && <p style={{color: 'white', textAlign: 'center', marginTop: '20px'}}>Loading Game...</p>}
      <canvas ref={canvasRef} style={{ width: '100vw', height: '100vh', display: isLoading ? 'none' : 'block' }} />
    </div>
  );
};

export default GameCanvas;
