import type { Vec2, Platform } from '../wasm/loader';

export class Renderer {
  // ... (gl, program, attribute/uniform locations, buffers)
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private positionAttributeLocation: number;
  private texCoordAttributeLocation: number;
  private modelPositionUniformLocation: WebGLUniformLocation | null;
  private modelSizeUniformLocation: WebGLUniformLocation | null;
  private cameraPositionUniformLocation: WebGLUniformLocation | null;
  private textureUniformLocation: WebGLUniformLocation | null;
  // NEW: Uniform locations for spritesheet data
  private spriteFrameSizeUniformLocation: WebGLUniformLocation | null;
  private spriteSheetSizeUniformLocation: WebGLUniformLocation | null;
  private spriteFrameCoordUniformLocation: WebGLUniformLocation | null;
  private unitSquarePositionBuffer: WebGLBuffer | null = null;
  private unitSquareTexCoordBuffer: WebGLBuffer | null = null;

  constructor(canvas: HTMLCanvasElement, vsSource: string, fsSource: string) {
    // ... (context, shader, program setup)
    const context = canvas.getContext('webgl2');
    if (!context) throw new Error('WebGL2 is not supported.');
    this.gl = context;
    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fsSource);
    this.program = this.createProgram(vertexShader, fragmentShader);

    // Get attribute and uniform locations
    this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.texCoordAttributeLocation = this.gl.getAttribLocation(this.program, 'a_texCoord');
    this.modelPositionUniformLocation = this.gl.getUniformLocation(this.program, 'u_model_position');
    this.modelSizeUniformLocation = this.gl.getUniformLocation(this.program, 'u_model_size');
    this.cameraPositionUniformLocation = this.gl.getUniformLocation(this.program, 'u_camera_position');
    this.textureUniformLocation = this.gl.getUniformLocation(this.program, 'u_texture');
    // NEW: Get new uniform locations
    this.spriteFrameSizeUniformLocation = this.gl.getUniformLocation(this.program, 'u_sprite_frame_size');
    this.spriteSheetSizeUniformLocation = this.gl.getUniformLocation(this.program, 'u_sprite_sheet_size');
    this.spriteFrameCoordUniformLocation = this.gl.getUniformLocation(this.program, 'u_sprite_frame_coord');

    this.gl.viewport(0, 0, canvas.width, canvas.height);
    this.setupUnitSquare();
  }

  // ... (compileShader, createProgram, loadTexture, setupUnitSquare remain the same)
  private compileShader(type: number, source: string): WebGLShader { /* ... */ return this.gl.createShader(type)!; }
  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram { /* ... */ return this.gl.createProgram()!; }
  public async loadTexture(url: string): Promise<WebGLTexture> { /* ... */ return this.gl.createTexture()!; }
  private setupUnitSquare() { /* ... */ }

  private drawSprite(position: Vec2, size: Vec2, texture: WebGLTexture, sheetSize: Vec2, frameSize: Vec2, frameCoord: Vec2) {
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.uniform1i(this.textureUniformLocation, 0);
    this.gl.uniform2f(this.modelPositionUniformLocation, position.x, position.y);
    this.gl.uniform2f(this.modelSizeUniformLocation, size.x, size.y);
    
    // NEW: Set spritesheet uniforms
    this.gl.uniform2f(this.spriteSheetSizeUniformLocation, sheetSize.x, sheetSize.y);
    this.gl.uniform2f(this.spriteFrameSizeUniformLocation, frameSize.x, frameSize.y);
    this.gl.uniform2f(this.spriteFrameCoordUniformLocation, frameCoord.x, frameCoord.y);

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
      // Platforms are not animated, so we treat them as a 1x1 spritesheet
      for (const platform of platforms) {
        this.drawSprite(platform.position, platform.size, platformTexture, {x:128, y:32}, {x:128, y:32}, {x:0, y:0});
      }
    }

    if (playerTexture && playerAnim) {
      // NEW: Calculate the correct frame to draw based on animation state
      const frameSize = { x: 64, y: 64 };
      const sheetSize = { x: 256, y: 192 }; // Example: 4 frames wide, 3 rows high
      let frameX = 0;
      let frameY = 0;

      if (playerAnim.currentState === "idle") {
        frameY = 0;
        frameX = (playerAnim.currentFrame % 2); // 2 frames in idle animation
      } else if (playerAnim.currentState === "run") {
        frameY = 1;
        frameX = (playerAnim.currentFrame % 4); // 4 frames in run animation
      } else if (playerAnim.currentState === "jump") {
        frameY = 2;
        frameX = 0; // 1 frame in jump animation
      }

      const frameCoord = { x: frameX * frameSize.x, y: frameY * frameSize.y };
      this.drawSprite(playerPosition, playerSize, playerTexture, sheetSize, frameSize, frameCoord);
    }
  }
}
