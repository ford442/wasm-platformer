import type { Vec2, Platform, AnimationState } from '../wasm/loader';

// NEW: A type to hold a texture and its dimensions together.
export type TextureObject = {
    texture: WebGLTexture;
    width: number;
    height: number;
};

export class Renderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private positionAttributeLocation: number;
  private texCoordAttributeLocation: number;
  private modelPositionUniformLocation: WebGLUniformLocation | null;
  private modelSizeUniformLocation: WebGLUniformLocation | null;
  private cameraPositionUniformLocation: WebGLUniformLocation | null;
  private textureUniformLocation: WebGLUniformLocation | null;
  private spriteFrameSizeUniformLocation: WebGLUniformLocation | null;
  private spriteSheetSizeUniformLocation: WebGLUniformLocation | null;
  private spriteFrameCoordUniformLocation: WebGLUniformLocation | null;
  private flipHorizontalUniformLocation: WebGLUniformLocation | null;
  private unitSquarePositionBuffer: WebGLBuffer | null = null;
  private unitSquareTexCoordBuffer: WebGLBuffer | null = null;

  constructor(canvas: HTMLCanvasElement, vsSource: string, fsSource: string) {
    const context = canvas.getContext('webgl2');
    if (!context) throw new Error('WebGL2 is not supported.');
    this.gl = context;
    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fsSource);
    this.program = this.createProgram(vertexShader, fragmentShader);

    // ... (Getting uniform locations is the same)
    this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.texCoordAttributeLocation = this.gl.getAttribLocation(this.program, 'a_texCoord');
    this.modelPositionUniformLocation = this.gl.getUniformLocation(this.program, 'u_model_position');
    this.modelSizeUniformLocation = this.gl.getUniformLocation(this.program, 'u_model_size');
    this.cameraPositionUniformLocation = this.gl.getUniformLocation(this.program, 'u_camera_position');
    this.textureUniformLocation = this.gl.getUniformLocation(this.program, 'u_texture');
    this.spriteFrameSizeUniformLocation = this.gl.getUniformLocation(this.program, 'u_sprite_frame_size');
    this.spriteSheetSizeUniformLocation = this.gl.getUniformLocation(this.program, 'u_sprite_sheet_size');
    this.spriteFrameCoordUniformLocation = this.gl.getUniformLocation(this.program, 'u_sprite_frame_coord');
    this.flipHorizontalUniformLocation = this.gl.getUniformLocation(this.program, 'u_flip_horizontal');

    this.gl.viewport(0, 0, canvas.width, canvas.height);
    this.setupUnitSquare();
  }
  
  private compileShader(type: number, source: string): WebGLShader { /* ... */ return this.gl.createShader(type)!; }
  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram { /* ... */ return this.gl.createProgram()!; }
  
  // FIX: This function now returns a TextureObject with the image's dimensions.
  public async loadTexture(url: string): Promise<TextureObject> {
    const texture = this.gl.createTexture();
    if (!texture) throw new Error('Could not create texture');
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = url;
      image.onload = () => {
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
        
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);

        resolve({ texture, width: image.width, height: image.height });
      };
      image.onerror = (err) => reject(`Failed to load texture from ${url}: ${err}`);
    });
  }

  private setupUnitSquare() { /* ... */ }

  private drawSprite(position: Vec2, size: Vec2, textureObj: TextureObject, frameSize: Vec2, frameCoord: Vec2, facingLeft: boolean) {
    this.gl.bindTexture(this.gl.TEXTURE_2D, textureObj.texture);
    this.gl.uniform1i(this.textureUniformLocation, 0);
    this.gl.uniform2f(this.modelPositionUniformLocation, position.x, position.y);
    this.gl.uniform2f(this.modelSizeUniformLocation, size.x, size.y);
    
    // FIX: Use the actual dimensions from the loaded texture object.
    this.gl.uniform2f(this.spriteSheetSizeUniformLocation, textureObj.width, textureObj.height);
    this.gl.uniform2f(this.spriteFrameSizeUniformLocation, frameSize.x, frameSize.y);
    this.gl.uniform2f(this.spriteFrameCoordUniformLocation, frameCoord.x, frameCoord.y);
    this.gl.uniform1i(this.flipHorizontalUniformLocation, facingLeft ? 1 : 0);

    if (this.positionAttributeLocation !== -1) { /* ... */ }
    if (this.texCoordAttributeLocation !== -1) { /* ... */ }
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  public drawScene(cameraPosition: Vec2, playerPosition: Vec2, playerSize: Vec2, platforms: Platform[], playerTexture: TextureObject | null, platformTexture: TextureObject | null, playerAnim: AnimationState | null) {
    this.gl.clearColor(0.1, 0.1, 0.1, 1.0); this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.useProgram(this.program);
    this.gl.uniform2f(this.cameraPositionUniformLocation, cameraPosition.x, cameraPosition.y);
    this.gl.enable(this.gl.BLEND); this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    if (platformTexture) {
      for (const platform of platforms) {
        this.drawSprite(platform.position, platform.size, platformTexture, {x:platformTexture.width, y:platformTexture.height}, {x:platformTexture.width, y:platformTexture.height}, {x:0, y:0}, false);
      }
    }

    if (playerTexture && playerAnim) {
      const frameSize = { x: 64, y: 64 };
      let frameX = 0;
      let frameY = 0;

      if (playerAnim.currentState === "idle") {
        frameY = 0;
        frameX = (playerAnim.currentFrame % 2); 
      } else if (playerAnim.currentState === "run") {
        frameY = 1;
        frameX = (playerAnim.currentFrame % 4);
      } else if (playerAnim.currentState === "jump") {
        frameY = 2;
        frameX = 0;
      }

      const frameCoord = { x: frameX * frameSize.x, y: frameY * frameSize.y };
      this.drawSprite(playerPosition, playerSize, playerTexture, frameSize, frameCoord, playerAnim.facingLeft);
    }
  }
}


/*
================================================================================
  FILE: src/components/GameCanvas.tsx
================================================================================
*/
import React, { useRef, useEffect, useState } from 'react';
import { Renderer, type TextureObject } from '../gl/renderer'; // FIX: Import TextureObject
import { loadWasmModule, type Game, type InputState, type PlatformList, type Vec2, type Platform, type AnimationState } from '../wasm/loader';
import vertexShaderSource from '../gl/shaders/basic.vert.glsl?raw';
import fragmentShaderSource from '../gl/shaders/basic.frag.glsl?raw';

const WAZZY_SPRITESHEET_URL = '/wazzy_spritesheet.png';
const PLATFORM_TEXTURE_URL = '/platform.png';

const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const gameInstanceRef = useRef<Game | null>(null);
  const keysRef = useRef<Record<string, boolean>>({ 'ArrowLeft': false, 'ArrowRight': false, 'Space': false });
  // FIX: The refs now store the entire TextureObject.
  const playerTextureRef = useRef<TextureObject | null>(null);
  const platformTextureRef = useRef<TextureObject | null>(null);
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => { /* ... */ }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initialize = async () => {
      try {
        const wasmModule = await loadWasmModule();
        const game = new wasmModule.Game();
        gameInstanceRef.current = game;
        
        const renderer = new Renderer(canvas, vertexShaderSource, fragmentShaderSource);
        rendererRef.current = renderer;

        const [pTex, platTex] = await Promise.all([
          renderer.loadTexture(WAZZY_SPRITESHEET_URL),
          renderer.loadTexture(PLATFORM_TEXTURE_URL)
        ]);
        playerTextureRef.current = pTex;
        platformTextureRef.current = platTex;
        setIsReady(true);
      } catch (error) {
        console.error("Failed to initialize game:", error);
      }
    };
    initialize();

    return () => { if (gameInstanceRef.current) gameInstanceRef.current.delete(); };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    let lastTime = performance.now();
    let animationFrameId = 0;
    
    const gameLoop = (timestamp: number) => {
      const renderer = rendererRef.current;
      const gameInstance = gameInstanceRef.current;
      const pTex = playerTextureRef.current;
      const platTex = platformTextureRef.current;
      if (!renderer || !gameInstance || !pTex || !platTex) { animationFrameId = requestAnimationFrame(gameLoop); return; }
      
      const deltaTime = (timestamp - lastTime) / 1000.0;
      lastTime = timestamp;
      const inputState: InputState = { /* ... */ };
      gameInstance.handleInput(inputState);
      gameInstance.update(deltaTime);
      
      const playerPosition = gameInstance.getPlayerPosition();
      const cameraPosition = gameInstance.getCameraPosition();
      const wasmPlatforms = gameInstance.getPlatforms();
      const playerAnim = gameInstance.getPlayerAnimationState();
      
      const jsPlatforms: Platform[] = [];
      for (let i = 0; i < wasmPlatforms.size(); i++) {
        jsPlatforms.push(wasmPlatforms.get(i));
      }

      const playerSize = { x: 0.3, y: 0.3 }; 
      
      renderer.drawScene(cameraPosition, playerPosition, playerSize, jsPlatforms, pTex, platTex, playerAnim);

      animationFrameId = requestAnimationFrame(gameLoop);
    };
    animationFrameId = requestAnimationFrame(gameLoop);
    return () => { cancelAnimationFrame(animationFrameId); };
  }, [isReady]);

  const canvasStyle: React.CSSProperties = { /* ... */ };
  return <canvas ref={canvasRef} width={1280} height={720} style={canvasStyle} />;
};

export default GameCanvas;
