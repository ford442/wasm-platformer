import React, { useRef, useEffect, useState } from 'react';
import loadGameModule, { GameModule } from '../wasm/loader'; // Corrected import
import { Renderer } from '../gl/renderer';

const GameCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wasmModule = useRef<GameModule | null>(null);
    const renderer = useRef<Renderer | null>(null);
    const game = useRef<any>(null);
    const keys = useRef<{ [key: string]: boolean }>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const jumpSound = useRef(new Audio('jump.mp3'));

    useEffect(() => {
        const init = async () => {
            try {
                if (!canvasRef.current) return;

                // Fetch shaders and wasm module in parallel
                const [spriteVs, spriteFs, bgVs, bgFs, module] = await Promise.all([
                    fetch('shaders/sprite.vs').then(res => res.text()),
                    fetch('shaders/sprite.fs').then(res => res.text()),
                    fetch('shaders/background.vs').then(res => res.text()),
                    fetch('shaders/background.fs').then(res => res.text()),
                    loadGameModule() // Correctly call the loader function
                ]);

                wasmModule.current = module;
                game.current = new module.instance.Game();
                renderer.current = new Renderer(canvasRef.current, spriteVs, spriteFs, bgVs, bgFs);
                await renderer.current.init();
                
                setIsLoading(false);

            } catch (err) {
                console.error("Failed to initialize game:", err);
                setError(err instanceof Error ? err.message : String(err));
            }
        };

        init();

        const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.key] = true; };
        const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.key] = false; };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            game.current?.delete();
        };
    }, []);

    useEffect(() => {
        let animationFrameId: number;

        const gameLoop = () => {
            if (!wasmModule.current || !game.current || !renderer.current) {
                animationFrameId = requestAnimationFrame(gameLoop);
                return;
            }

            const left = keys.current['a'] || keys.current['ArrowLeft'];
            const right = keys.current['d'] || keys.current['ArrowRight'];
            const jump = keys.current[' '] || keys.current['w'] || keys.current['ArrowUp'];
            
            game.current.update(left, right, jump);
            
            const renderDataPtr = game.current.getRenderData();
            const backgroundDataPtr = game.current.getBackgroundData();
            const soundDataPtr = game.current.getSoundData();

            const spriteData = new Float32Array(wasmModule.current.instance.HEAPF32.buffer, renderDataPtr.data(), renderDataPtr.size() * 8);
            const backgroundData = new Float32Array(wasmModule.current.instance.HEAPF32.buffer, backgroundDataPtr.data(), backgroundDataPtr.size() * 4);
            const soundsToPlay = new Float32Array(wasmModule.current.instance.HEAPF32.buffer, soundDataPtr.data(), soundDataPtr.size());

            renderer.current.draw(spriteData, backgroundData);

            soundsToPlay.forEach((soundId: number) => {
                if (soundId === 1) {
                    jumpSound.current.currentTime = 0;
                    jumpSound.current.play().catch(e => console.log("Audio play failed:", e));
                }
            });

            animationFrameId = requestAnimationFrame(gameLoop);
        };

        if (!isLoading && !error) {
            gameLoop();
        }

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isLoading, error]);

    if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
    
    return (
        <div>
            {isLoading ? <p>Loading...</p> : <canvas ref={canvasRef} width={800} height={600} />}
        </div>
    );
};

export default GameCanvas;
