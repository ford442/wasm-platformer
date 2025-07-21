import type { Vec2, Platform, AnimationState } from '../wasm/loader';

export type TextureObject = {
    texture: WebGLTexture;
    width: number;
    height: number;
};

export class Renderer {
  private gl: WebGL2RenderingContext;
  
  // Sprite rendering properties
  private spriteProgram: WebGLProgram;
  private spritePositionAttributeLocation: number;
  private spriteTexCoordAttributeLocation: number;
  private spriteModelPositionUniformLocation: WebGLUniformLocation | null;
  private spriteModelSizeUniformLocation: WebGLUniformLocation | null;
  private spriteCameraPositionUniformLocation: WebGLUniformLocation | null;
  private spriteTextureUniformLocation: WebGLUniformLocation | null;
  private spriteFrameSizeUniformLocation: WebGLUniformLocation | null;
  private spriteSheetSizeUniformLocation: WebGLUniformLocation | null;
  private spriteFrameCoordUniformLocation: WebGLUniformLocation | null;
  private spriteFlipHorizontalUniformLocation: WebGLUniformLocation | null;
  private spriteProjectionMatrixUniformLocation: WebGLUniformLocation | null;
  
  // Background rendering properties
  private backgroundProgram: WebGLProgram;
  private backgroundPositionAttributeLocation: number;
  private backgroundCameraPositionUniformLocation: WebGLUniformLocation | null;
  private backgroundTextureSizeUniformLocation: WebGLUniformLocation | null;
  private backgroundResolutionUniformLocation: WebGLUniformLocation | null;
  private backgroundTextureUniformLocation: WebGLUniformLocation | null;
  
  private unitSquarePositionBuffer: WebGLBuffer | null = null;
  private unitSquareTexCoordBuffer: WebGLBuffer | null = null;
  private fullScreenQuadBuffer: WebGLBuffer | null = null;

  constructor(canvas: HTMLCanvasElement, spriteVsSource: string, spriteFsSource: string, bgVsSource: string, bgFsSource: string) {
    const context = canvas.getContext('webgl2');
    if (!context) throw new Error('WebGL2 is not supported.');
    this.gl = context;

    // --- Create Sprite Program ---
    const spriteVertexShader = this.compileShader(this.gl.VERTEX_SHADER, spriteVsSource);
    const spriteFragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, spriteFsSource);
    this.spriteProgram = this.createProgram(spriteVertexShader, spriteFragmentShader);

    this.spritePositionAttributeLocation = this.gl.getAttribLocation(this.spriteProgram, 'a_position');
    this.spriteTexCoordAttributeLocation = this.gl.getAttribLocation(this.spriteProgram, 'a_texCoord');
    this.spriteModelPositionUniformLocation = this.gl.getUniformLocation(this.spriteProgram, 'u_model_position');
    this.spriteModelSizeUniformLocation = this.gl.getUniformLocation(this.spriteProgram, 'u_model_size');
    this.spriteCameraPositionUniformLocation = this.gl.getUniformLocation(this.spriteProgram, 'u_camera_position');
    this.spriteTextureUniformLocation = this.gl.getUniformLocation(this.spriteProgram, 'u_texture');
    this.spriteFrameSizeUniformLocation = this.gl.getUniformLocation(this.spriteProgram, 'u_sprite_frame_size');
    this.spriteSheetSizeUniformLocation = this.gl.getUniformLocation(this.spriteProgram, 'u_sprite_sheet_size');
    this.spriteFrameCoordUniformLocation = this.gl.getUniformLocation(this.spriteProgram, 'u_sprite_frame_coord');
    this.spriteFlipHorizontalUniformLocation = this.gl.getUniformLocation(this.spriteProgram, 'u_flip_horizontal');
    this.spriteProjectionMatrixUniformLocation = this.gl.getUniformLocation(this.spriteProgram, 'u_projection');

    // --- Create Background Program ---
    const bgVertexShader = this.compileShader(this.gl.VERTEX_SHADER, bgVsSource);
    const bgFragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, bgFsSource);
    this.backgroundProgram = this.createProgram(bgVertexShader, bgFragmentShader);
    
    this.backgroundPositionAttributeLocation = this.gl.getAttribLocation(this.backgroundProgram, 'a_position');
    this.backgroundCameraPositionUniformLocation = this.gl.getUniformLocation(this.backgroundProgram, 'u_camera_position');
    this.backgroundTextureSizeUniformLocation = this.gl.getUniformLocation(this.backgroundProgram, 'u_texture_size');
    this.backgroundResolutionUniformLocation = this.gl.getUniformLocation(this.backgroundProgram, 'u_resolution');
    this.backgroundTextureUniformLocation = this.gl.getUniformLocation(this.backgroundProgram, 'u_texture');

    this.gl.viewport(0, 0, canvas.width, canvas.height);
    this.setupGeometry();
  }
  
  private compileShader(type: number, source: string): WebGLShader { /* ... */ return this.gl.createShader(type)!; }
  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram { /* ... */ return this.gl.createProgram()!; }
  public async loadTexture(url: string): Promise<TextureObject> { /* ... */ return { texture: this.gl.createTexture()!, width: 0, height: 0 }; }

  private setupGeometry() {
    const positions = new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5]);
    this.unitSquarePositionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.unitSquarePositionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

    const texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]);
    this.unitSquareTexCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.unitSquareTexCoordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.STATIC_DRAW);

    const fullScreenPositions = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
    this.fullScreenQuadBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.fullScreenQuadBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, fullScreenPositions, this.gl.STATIC_DRAW);
  }

  private drawSprite(position: Vec2, size: Vec2, textureObj: TextureObject, sheetSize: Vec2, frameSize: Vec2, frameCoord: Vec2, facingLeft: boolean) { /* ... */ }

  private drawBackground(cameraPosition: Vec2, backgroundTexture: TextureObject) {
    this.gl.useProgram(this.backgroundProgram);

    this.gl.bindTexture(this.gl.TEXTURE_2D, backgroundTexture.texture);
    this.gl.uniform1i(this.backgroundTextureUniformLocation, 0);
    this.gl.uniform2f(this.backgroundCameraPositionUniformLocation, cameraPosition.x, cameraPosition.y);
    this.gl.uniform2f(this.backgroundTextureSizeUniformLocation, backgroundTexture.width, backgroundTexture.height);
    this.gl.uniform2f(this.backgroundResolutionUniformLocation, this.gl.canvas.width, this.gl.canvas.height);

    this.gl.enableVertexAttribArray(this.backgroundPositionAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.fullScreenQuadBuffer);
    this.gl.vertexAttribPointer(this.backgroundPositionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
    
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  public drawScene(cameraPosition: Vec2, playerPosition: Vec2, playerSize: Vec2, platforms: Platform[], playerTexture: TextureObject | null, platformTexture: TextureObject | null, backgroundTexture: TextureObject | null, playerAnim: AnimationState | null) {
    this.gl.clearColor(0.1, 0.1, 0.1, 1.0); this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    
    if (backgroundTexture) {
      this.drawBackground(cameraPosition, backgroundTexture);
    }

    this.gl.useProgram(this.spriteProgram);
    
    const aspectRatio = this.gl.canvas.width / this.gl.canvas.height;
    const worldWidth = 4.0;
    const worldHeight = worldWidth / aspectRatio;
    const projectionMatrix = [ 2.0 / worldWidth, 0, 0, 0, 0, 2.0 / worldHeight, 0, 0, 0, 0, -1, 0, 0, 0, 0, 1 ];
    this.gl.uniformMatrix4fv(this.spriteProjectionMatrixUniformLocation, false, projectionMatrix);
    
    this.gl.uniform2f(this.spriteCameraPositionUniformLocation, cameraPosition.x, cameraPosition.y);
    this.gl.enable(this.gl.BLEND); this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    if (platformTexture) { /* ... draw platforms ... */ }
    if (playerTexture && playerAnim) { /* ... draw player ... */ }
  }
}
