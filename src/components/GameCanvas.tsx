

import React, { useRef, useEffect, useState } from 'react';
import { WasmModule } from '../wasm/loader';
import { Renderer } from '../gl/renderer';

const GameCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const wasmModule = useRef<WasmModule | null>(null);
    const renderer = useRef<Renderer | null>(null);
    const game = useRef<any>(null); // Using 'any' for the Emscripten game object
    const keys = useRef<{ [key: string]: boolean }>({});
    const [isLoading, setIsLoading] = useState(true);

    // Load sounds
    const jumpSound = useRef(new Audio('jump.mp3'));
    const landSound = useRef(new Audio('land.mp3'));

    useEffect(() => {
        const init = async () => {
            try {
                const module = new WasmModule();
                await module.load();
                wasmModule.current = module;

                game.current = new module.instance.Game();

                if (canvasRef.current) {
                    const gl = canvasRef.current.getContext('webgl2');
                    if (gl) {
                        renderer.current = new Renderer(gl);
                        await renderer.current.init();
                    }
                }
                
                setIsLoading(false);

            } catch (error) {
                console.error("Failed to initialize game:", error);
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
            
            const renderData = game.current.getRenderData();
            const backgroundData = game.current.getBackgroundData();
            renderer.current.render(renderData, backgroundData);

            // --- CORRECTED SOUND LOGIC ---
            // Get sound data from C++
            const soundData = game.current.getSoundData();
            
            // The vector is reused, so we need to get a copy to iterate safely
            const soundsToPlay = new Float32Array(wasmModule.current.instance.HEAPF32.buffer, soundData.data(), soundData.size());

            soundsToPlay.forEach((soundId: number) => {
                if (soundId === 1) { // 1 is the ID for the jump sound
                    jumpSound.current.currentTime = 0;
                    jumpSound.current.play();
                }
                // You could add else if (soundId === 2) for another sound, etc.
            });

            animationFrameId = requestAnimationFrame(gameLoop);
        };

        if (!isLoading) {
            gameLoop();
        }

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [isLoading]);

    return (
        <div>
            {isLoading ? <p>Loading...</p> : <canvas ref={canvasRef} width={800} height={600} />}
        </div>
    );
};

export default GameCanvas;
