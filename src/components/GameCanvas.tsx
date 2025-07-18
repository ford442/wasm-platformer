/*
================================================================================
  FILE: src/components/GameCanvas.tsx (Updated for Textures)
================================================================================
*/
import React, { useRef, useEffect, useState } from 'react';
// Note: The Renderer, loader, and shader code are now embedded in this file
// to resolve the WebGL and build errors.

//================================================================================
// TYPE DEFINITIONS
//================================================================================
interface Vec2 { x: number; y: number; }
interface Platform { position: Vec2; size: Vec2; }
interface PlatformList { get(index: number): Platform; size(): number; }
interface InputState { left: boolean; right: boolean; jump: boolean; }
interface Game {
  update(deltaTime: number): void;
  handleInput(inputState: InputState): void;
  getPlayerPosition(): Vec2;
  getCameraPosition(): Vec2;
  getPlatforms(): PlatformList;
  delete(): void;
}
interface GameModule { Game: { new(): Game }; }

//================================================================================
// WASM LOADER
//================================================================================
const loadWasmModule = async (): Promise<GameModule> => {
  const factory = (window as any).createGameModule;
  if (!factory) throw new Error("WASM module factory not found on window.");
  return await factory() as GameModule;
};

//================================================================================
// SHADER SOURCE CODE
//================================================================================
const vertexShaderSource = `#version 300 es
in vec2 a_position;
in vec2 a_texCoord;
uniform vec2 u_model_position;
uniform vec2 u_model_size;
uniform vec2 u_camera_position;
out vec2 v_texCoord;

void main() {
  vec2 world_position = (a_position * u_model_size) + u_model_position;
  vec2 view_position = world_position - u_camera_position;
  gl_Position = vec4(view_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}`;

const fragmentShaderSource = `#version 300 es
precision highp float;
in vec2 v_texCoord;
uniform sampler2D u_texture;
out vec4 outColor;

void main() {
  outColor = texture(u_texture, v_texCoord);
}`;

//================================================================================
// RENDERER CLASS
//================================================================================
class Renderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private positionAttributeLocation: number;
  private texCoordAttributeLocation: number;
  private modelPositionUniformLocation: WebGLUniformLocation | null;
  private modelSizeUniformLocation: WebGLUniformLocation | null;
  private cameraPositionUniformLocation: WebGLUniformLocation | null;
  private textureUniformLocation: WebGLUniformLocation | null;
  private unitSquarePositionBuffer: WebGLBuffer | null = null;
  private unitSquareTexCoordBuffer: WebGLBuffer | null = null;

  constructor(canvas: HTMLCanvasElement, vsSource: string, fsSource: string) {
    const context = canvas.getContext('webgl2');
    if (!context) throw new Error('WebGL2 is not supported.');
    this.gl = context;

    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fsSource);
    this.program = this.createProgram(vertexShader, fragmentShader);

    this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.texCoordAttributeLocation = this.gl.getAttribLocation(this.program, 'a_texCoord');
    this.modelPositionUniformLocation = this.gl.getUniformLocation(this.program, 'u_model_position');
    this.modelSizeUniformLocation = this.gl.getUniformLocation(this.program, 'u_model_size');
    this.cameraPositionUniformLocation = this.gl.getUniformLocation(this.program, 'u_camera_position');
    this.textureUniformLocation = this.gl.getUniformLocation(this.program, 'u_texture');

    this.gl.viewport(0, 0, canvas.width, canvas.height);
    this.setupUnitSquare();
  }

  // FIX: Added robust error checking for shader compilation.
  private compileShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type);
    if (!shader) throw new Error('Unable to create shader');
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const errorLog = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(`Failed to compile shader: ${errorLog}`);
    }
    return shader;
  }

  // FIX: Added robust error checking for program linking.
  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
    const program = this.gl.createProgram();
    if (!program) throw new Error('Unable to create program');
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const errorLog = this.gl.getProgramInfoLog(program);
      this.gl.deleteProgram(program);
      throw new Error(`Failed to link program: ${errorLog}`);
    }
    return program;
  }

  public async loadTexture(url: string): Promise<WebGLTexture> {
    const texture = this.gl.createTexture();
    if (!texture) throw new Error('Could not create texture');
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous"; // Attempt to fix COEP issues
      image.src = url;
      image.onload = () => {
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
        resolve(texture);
      };
      image.onerror = (err) => reject(`Failed to load texture from ${url}: ${err}`);
    });
  }

  private setupUnitSquare() {
    const positions = new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5]);
    this.unitSquarePositionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.unitSquarePositionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

    const texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]);
    this.unitSquareTexCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.unitSquareTexCoordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.STATIC_DRAW);
  }

  private drawSprite(position: Vec2, size: Vec2, texture: WebGLTexture) {
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.uniform1i(this.textureUniformLocation, 0);
    this.gl.uniform2f(this.modelPositionUniformLocation, position.x, position.y);
    this.gl.uniform2f(this.modelSizeUniformLocation, size.x, size.y);

    this.gl.enableVertexAttribArray(this.positionAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.unitSquarePositionBuffer);
    this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.enableVertexAttribArray(this.texCoordAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.unitSquareTexCoordBuffer);
    this.gl.vertexAttribPointer(this.texCoordAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  public drawScene(cameraPosition: Vec2, playerPosition: Vec2, playerSize: Vec2, platforms: Platform[], playerTexture: WebGLTexture | null, platformTexture: WebGLTexture | null) {
    this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.useProgram(this.program);
    this.gl.uniform2f(this.cameraPositionUniformLocation, cameraPosition.x, cameraPosition.y);
    
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    if (platformTexture) {
      for (const platform of platforms) {
        this.drawSprite(platform.position, platform.size, platformTexture);
      }
    }
    if (playerTexture) {
      this.drawSprite(playerPosition, playerSize, playerTexture);
    }
  }
}

//================================================================================
// MAIN REACT COMPONENT
//================================================================================
const WAZZY_SPRITE_URL = '/wazzy.png';
const PLATFORM_TEXTURE_URL = '/platform.png';

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const gameInstanceRef = useRef<Game | null>(null);
  const animationFrameId = useRef<number>(0);
  const keysRef = useRef<Record<string, boolean>>({
    'ArrowLeft': false, 'ArrowRight': false, 'Space': false,
  });

  const [playerTexture, setPlayerTexture] = useState<WebGLTexture | null>(null);
  const [platformTexture, setPlatformTexture] = useState<WebGLTexture | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.code in keysRef.current) keysRef.current[e.code] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.code in keysRef.current) keysRef.current[e.code] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let lastTime = 0;
    
    const initialize = async () => {
      try {
        const wasmModule = await loadWasmModule();
        const game = new wasmModule.Game();
        gameInstanceRef.current = game;
        
        const renderer = new Renderer(canvas, vertexShaderSource, fragmentShaderSource);
        rendererRef.current = renderer;

        const [pTex, platTex] = await Promise.all([
          renderer.loadTexture(WAZZY_SPRITE_URL),
          renderer.loadTexture(PLATFORM_TEXTURE_URL)
        ]);
        setPlayerTexture(pTex);
        setPlatformTexture(platTex);
        setIsLoading(false);

        lastTime = performance.now();
        gameLoop(lastTime);
      } catch (error) {
        console.error("Failed to initialize game:", error);
      }
    };

    const gameLoop = (timestamp: number) => {
      if (isLoading || !playerTexture || !platformTexture) {
        animationFrameId.current = requestAnimationFrame(gameLoop);
        return;
      }
      
      const deltaTime = (timestamp - lastTime) / 1000.0;
      lastTime = timestamp;

      const renderer = rendererRef.current;
      const gameInstance = gameInstanceRef.current;

      if (renderer && gameInstance) {
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
        
        const jsPlatforms: Platform[] = [];
        for (let i = 0; i < wasmPlatforms.size(); i++) {
          jsPlatforms.push(wasmPlatforms.get(i));
        }

        const playerSize = { x: 0.2, y: 0.2 }; 
        
        renderer.drawScene(cameraPosition, playerPosition, playerSize, jsPlatforms, playerTexture, platformTexture);
      }

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    initialize();

    return () => {
      cancelAnimationFrame(animationFrameId.current);
      if (gameInstanceRef.current) gameInstanceRef.current.delete();
    };
  }, [isLoading, playerTexture, platformTexture]);

  const canvasStyle: React.CSSProperties = {
    width: '100%', height: '100%', backgroundColor: '#000',
    borderRadius: '8px', boxShadow: '0 0 20px rgba(0, 170, 255, 0.5)',
    border: '2px solid var(--primary-color)'
  };
  return <canvas ref={canvasRef} width={1280} height={720} style={canvasStyle} />;
};

export default GameCanvas;
