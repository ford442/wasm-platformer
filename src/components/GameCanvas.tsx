import React, { useRef, useEffect } from 'react';

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // --- WebGL2 Initialization ---
    // In the future, this is where we will:
    // 1. Get the WebGL2 rendering context.
    // 2. Initialize our renderer class from `src/gl/renderer.ts`.
    // 3. Start the game loop (`requestAnimationFrame`).
    const context = canvas.getContext('2d'); // Using 2D for now as a placeholder
    if (context) {
      // Placeholder rendering
      context.fillStyle = '#000';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = 'white';
      context.font = '20px Orbitron';
      context.textAlign = 'center';
      context.fillText('WebGL2 Renderer Initializing...', canvas.width / 2, canvas.height / 2);
    }

  }, []); // Empty dependency array ensures this runs only once on mount

  const canvasStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    borderRadius: '8px',
    boxShadow: '0 0 20px rgba(0, 170, 255, 0.5)',
    border: '2px solid var(--primary-color)'
  };

  return <canvas ref={canvasRef} width={1280} height={720} style={canvasStyle} />;
};
