// src/components/GameCanvas.tsx
import React, { useEffect, useRef, useState } from 'react';
import { loadWasmModule, GameModule } from '../wasm/loader';
import { FilamentRenderer, RenderData } from '../filament/renderer';

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
  const wasmModuleRef = useRef<GameModule | null>(null);
  const rendererRef = useRef<FilamentRenderer | null>(null);
  const keysPressed = useKeyPress();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!canvasRef.current) return;
      setIsLoading(true);

      const wasmModule = await loadWasmModule();
      // This is required by your specific C++ module
      wasmModule._init();
      wasmModuleRef.current = wasmModule;

      const fRenderer = new FilamentRenderer(canvasRef.current);
      await fRenderer.initialize();
      rendererRef.current = fRenderer;
      
      let lastTime = 0;
      const gameLoop = (time: number) => {
        if (!wasmModuleRef.current || !rendererRef.current) {
          requestAnimationFrame(gameLoop);
          return;
        }

        const dt = (time - lastTime) / 1000;
        lastTime = time;

        const left = keysPressed['ArrowLeft'] || keysPressed['KeyA'] || 0;
        const right = keysPressed['ArrowRight'] || keysPressed['KeyD'] || 0;
        const jump = keysPressed['Space'] || keysPressed['ArrowUp'] || keysPressed['KeyW'] || 0;

        // Correctly calling WASM functions WITH underscores
        wasmModuleRef.current._update(dt, left, right, jump);

        const renderDataPtr = wasmModuleRef.current._getRenderData();
        const renderDataSize = wasmModuleRef.current._getRenderDataSize();
        // Correctly accessing the WASM heap property
        const buffer = wasmModuleRef.current.HEAPU8.buffer.slice(renderDataPtr, renderDataPtr + renderDataSize);
        
        const renderData: RenderData = { buffer };
        
        rendererRef.current.draw(renderData);

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
