import type { Vec2, Platform, AnimationState } from '../wasm/loader';

import vertexShaderSource from './shaders/tex.vert.glsl?raw';
import fragmentShaderSource from './shaders/tex.frag.glsl?raw';
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
  // NEW: Uniform location for the flip boolean
  private flipHorizontalUniformLocation: WebGLUniformLocation | null;
  private unitSquarePositionBuffer: WebGLBuffer | null = null;
  private unitSquareTexCoordBuffer: WebGLBuffer | null = null;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('webgl2');
    if (!context) throw new Error('WebGL2 is not supported.');
    this.gl = context;

    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
    this.program = this.createProgram(vertexShader, fragmentShader);

    // Get attribute and uniform locations
    this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.texCoordAttributeLocation = this.gl.getAttribLocation(this.program, 'a_texCoord');
    this.modelPositionUniformLocation = this.gl.getUniformLocation(this.program, 'u_model_position');
    this.modelSizeUniformLocation = this.gl.getUniformLocation(this.program, 'u_model_size');
    this.cameraPositionUniformLocation = this.gl.getUniformLocation(this.program, 'u_camera_position');
    this.textureUniformLocation = this.gl.getUniformLocation(this.program, 'u_texture');
    this.spriteFrameSizeUniformLocation = this.gl.getUniformLocation(this.program, 'u_sprite_frame_size');
    this.spriteSheetSizeUniformLocation = this.gl.getUniformLocation(this.program, 'u_sprite_sheet_size');
    this.spriteFrameCoordUniformLocation = this.gl.getUniformLocation(this.program, 'u_sprite_frame_coord');
    // NEW: Get the location for the flip uniform
    this.flipHorizontalUniformLocation = this.gl.getUniformLocation(this.program, 'u_flip_horizontal');

    this.gl.viewport(0, 0, canvas.width, canvas.height);
    this.setupUnitSquare();
  }

  // ... (compileShader, createProgram, loadTexture, setupUnitSquare remain the same)
  private compileShader(type: number, source: string): WebGLShader { /* ... */ return this.gl.createShader(type)!; }
  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram { /* ... */ return this.gl.createProgram()!; }
  public async loadTexture(url: string): Promise<WebGLTexture> { /* ... */ return this.gl.createTexture()!; }
  private setupUnitSquare() { /* ... */ }

  private drawSprite(position: Vec2, size: Vec2, texture: WebGLTexture, sheetSize: Vec2, frameSize: Vec2, frameCoord: Vec2, facingLeft: boolean) {
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.uniform1i(this.textureUniformLocation, 0);
    this.gl.uniform2f(this.modelPositionUniformLocation, position.x, position.y);
    this.gl.uniform2f(this.modelSizeUniformLocation, size.x, size.y);
    
    this.gl.uniform2f(this.spriteSheetSizeUniformLocation, sheetSize.x, sheetSize.y);
    this.gl.uniform2f(this.spriteFrameSizeUniformLocation, frameSize.x, frameSize.y);
    this.gl.uniform2f(this.spriteFrameCoordUniformLocation, frameCoord.x, frameCoord.y);
    // NEW: Set the flip uniform. Use 1 for true, 0 for false.
    this.gl.uniform1i(this.flipHorizontalUniformLocation, facingLeft ? 1 : 0);

    // ... (enable/bind/point attributes and drawArrays remain the same)
    if (this.positionAttributeLocation !== -1) { /* ... */ }
    if (this.texCoordAttributeLocation !== -1) { /* ... */ }
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  public drawScene(cameraPosition: Vec2, playerPosition: Vec2, playerSize: Vec2, platforms: Platform[], playerTexture: WebGLTexture | null, platformTexture: WebGLTexture | null, playerAnim: AnimationState | null) {
    // ... (clear, useProgram, set camera, enable blend)
    this.gl.clearColor(0.1, 0.1, 0.1, 1.0); this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.useProgram(this.program);
    this.gl.uniform2f(this.cameraPositionUniformLocation, cameraPosition.x, cameraPosition.y);
    this.gl.enable(this.gl.BLEND); this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    if (platformTexture) {
      for (const platform of platforms) {
        this.drawSprite(platform.position, platform.size, platformTexture, {x:128, y:32}, {x:128, y:32}, {x:0, y:0}, false);
      }
    }

    if (playerTexture && playerAnim) {
      const frameSize = { x: 64, y: 64 };
      const sheetSize = { x: 256, y: 192 };
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
      // NEW: Pass the facingLeft property to the drawSprite call
      this.drawSprite(playerPosition, playerSize, playerTexture, sheetSize, frameSize, frameCoord, playerAnim.facingLeft);
    }
  }
}
