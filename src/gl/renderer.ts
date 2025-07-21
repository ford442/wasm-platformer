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
  
  // NEW: Background rendering properties
  private backgroundProgram: WebGLProgram;
  private backgroundPositionAttributeLocation: number;
  private backgroundCameraPositionUniformLocation: WebGLUniformLocation | null;
  private backgroundTextureSizeUniformLocation: WebGLUniformLocation | null;
  private backgroundResolutionUniformLocation: WebGLUniformLocation | null;
  private backgroundTextureUniformLocation: WebGLUniformLocation | null;
  
  private unitSquarePositionBuffer: WebGLBuffer | null = null;
  private unitSquareTexCoordBuffer: WebGLBuffer | null = null;

  constructor(canvas: HTMLCanvasElement, spriteVsSource: string, spriteFsSource: string, bgVsSource: string, bgFsSource: string) {
    const context = canvas.getContext('webgl2');
    if (!context) throw new Error('WebGL2 is not supported.');
    this.gl = context;

    // --- Create Sprite Program ---
    const spriteVertexShader = this.compileShader(this.gl.VERTEX_SHADER, spriteVsSource);
    const spriteFragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, spriteFsSource);
    this.spriteProgram = this.createProgram(spriteVertexShader, spriteFragmentShader);

    // Get sprite program locations
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

    // --- NEW: Create Background Program ---
    const bgVertexShader = this.compileShader(this.gl.VERTEX_SHADER, bgVsSource);
    const bgFragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, bgFsSource);
    this.backgroundProgram = this.createProgram(bgVertexShader, bgFragmentShader);
    
    // Get background program locations
    this.backgroundPositionAttributeLocation = this.gl.getAttribLocation(this.backgroundProgram, 'a_position');
    this.backgroundCameraPositionUniformLocation = this.gl.getUniformLocation(this.backgroundProgram, 'u_camera_position');
    this.backgroundTextureSizeUniformLocation = this.gl.getUniformLocation(this.backgroundProgram, 'u_texture_size');
    this.backgroundResolutionUniformLocation = this.gl.getUniformLocation(this.backgroundProgram, 'u_resolution');
    this.backgroundTextureUniformLocation = this.gl.getUniformLocation(this.backgroundProgram, 'u_texture');

    this.gl.viewport(0, 0, canvas.width, canvas.height);
    this.setupUnitSquare();
  }
  
private compileShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      throw new Error(`Shader compile error: ${this.gl.getShaderInfoLog(shader)}`);
    }
    return shader;
  }
  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
      const program = this.gl.createProgram()!;
      this.gl.attachShader(program, vertexShader);
      this.gl.attachShader(program, fragmentShader);
      this.gl.linkProgram(program);
      if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
          throw new Error(`Program link error: ${this.gl.getProgramInfoLog(program)}`);
      }
      return program;
  }
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

     
     private drawBackground(cameraPosition: Vec2, backgroundTexture: TextureObject) {
    this.gl.useProgram(this.backgroundProgram);

    this.gl.bindTexture(this.gl.TEXTURE_2D, backgroundTexture.texture);
    this.gl.uniform1i(this.backgroundTextureUniformLocation, 0);
    // Pass necessary data to the background shader
    this.gl.uniform2f(this.backgroundCameraPositionUniformLocation, cameraPosition.x, cameraPosition.y);
    this.gl.uniform2f(this.backgroundTextureSizeUniformLocation, backgroundTexture.width, backgroundTexture.height);
    this.gl.uniform2f(this.backgroundResolutionUniformLocation, this.gl.canvas.width, this.gl.canvas.height);
         
  private drawSprite(position: Vec2, size: Vec2, textureObj: TextureObject, sheetSize: Vec2, frameSize: Vec2, frameCoord: Vec2, facingLeft: boolean) {
    this.gl.bindTexture(this.gl.TEXTURE_2D, textureObj.texture);
    this.gl.uniform1i(this.textureUniformLocation, 0);
    this.gl.uniform2f(this.modelPositionUniformLocation, position.x, position.y);
    this.gl.uniform2f(this.modelSizeUniformLocation, size.x, size.y);
    this.gl.uniform2f(this.spriteSheetSizeUniformLocation, sheetSize.x, sheetSize.y);
    this.gl.uniform2f(this.spriteFrameSizeUniformLocation, frameSize.x, frameSize.y);
    this.gl.uniform2f(this.spriteFrameCoordUniformLocation, frameCoord.x, frameCoord.y);
    this.gl.uniform1i(this.flipHorizontalUniformLocation, facingLeft ? 1 : 0);

    if (this.positionAttributeLocation !== -1) {
        this.gl.enableVertexAttribArray(this.positionAttributeLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.unitSquarePositionBuffer);
        this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
    }
    if (this.texCoordAttributeLocation !== -1) {
        this.gl.enableVertexAttribArray(this.texCoordAttributeLocation);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.unitSquareTexCoordBuffer);
        this.gl.vertexAttribPointer(this.texCoordAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
    }
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }
         
private drawBackground(cameraPosition: Vec2, backgroundTexture: TextureObject) {
    this.gl.useProgram(this.backgroundProgram);

    this.gl.bindTexture(this.gl.TEXTURE_2D, backgroundTexture.texture);
    this.gl.uniform1i(this.backgroundTextureUniformLocation, 0);

    this.gl.uniform2f(this.backgroundCameraPositionUniformLocation, cameraPosition.x, cameraPosition.y);
    this.gl.uniform2f(this.backgroundTextureSizeUniformLocation, backgroundTexture.width, backgroundTexture.height);
    this.gl.uniform2f(this.backgroundResolutionUniformLocation, this.gl.canvas.width, this.gl.canvas.height);

    this.gl.enableVertexAttribArray(this.backgroundPositionAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.unitSquarePositionBuffer);
    this.gl.vertexAttribPointer(this.backgroundPositionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
    
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  public drawScene(cameraPosition: Vec2, playerPosition: Vec2, playerSize: Vec2, platforms: Platform[], playerTexture: TextureObject | null, platformTexture: TextureObject | null, backgroundTexture: TextureObject | null, playerAnim: AnimationState | null) {
    this.gl.clearColor(0.1, 0.1, 0.1, 1.0); this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    
    // Draw the background first
    if (backgroundTexture) {
      this.drawBackground(cameraPosition, backgroundTexture);
    }

    // Now, draw the sprites (player and platforms)
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
