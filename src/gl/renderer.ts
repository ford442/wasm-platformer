import type { Vec2, Platform, AnimationState } from '../wasm/loader';

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
  private textureDimensions: Map<WebGLTexture, { width: number, height: number }> = new Map();

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
    this.spriteFrameSizeUniformLocation = this.gl.getUniformLocation(this.program, 'u_sprite_frame_size');
    this.spriteSheetSizeUniformLocation = this.gl.getUniformLocation(this.program, 'u_sprite_sheet_size');
    this.spriteFrameCoordUniformLocation = this.gl.getUniformLocation(this.program, 'u_sprite_frame_coord');
    this.flipHorizontalUniformLocation = this.gl.getUniformLocation(this.program, 'u_flip_horizontal');

    this.gl.viewport(0, 0, canvas.width, canvas.height);
    this.setupUnitSquare();
  }

  // FIX: Replaced collapsed code with full, robust error-checking versions.
  private compileShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type);
    if (!shader) {
      throw new Error('Unable to create shader');
    }
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const errorLog = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(`Failed to compile shader: ${errorLog}`);
    }
    return shader;
  }

  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
    const program = this.gl.createProgram();
    if (!program) {
      throw new Error('Unable to create program');
    }
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
      image.src = url;
      image.onload = () => {
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);
                // FIX: Set texture parameters for pixel-perfect spritesheet rendering.
        // This prevents bleeding and distortion.
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR );

        this.textureDimensions.set(texture, { width: image.width, height: image.height });
        resolve(texture);
      };
      image.onerror = (err) => reject(`Failed to load texture from ${url}: ${err}`);
    });
  }

  public getTextureDimensions(texture: WebGLTexture): { width: number, height: number } | undefined {
    return this.textureDimensions.get(texture);
  }

  private setupUnitSquare() {
    const positions = new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5]);
    this.unitSquarePositionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.unitSquarePositionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.DYNAMIC_DRAW);

    const texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]);
    this.unitSquareTexCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.unitSquareTexCoordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.DYNAMIC_DRAW);
  }

  private drawSprite(position: Vec2, size: Vec2, texture: WebGLTexture, sheetSize: Vec2, frameSize: Vec2, frameCoord: Vec2, facingLeft: boolean) {
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.uniform1i(this.textureUniformLocation, 0);
    this.gl.uniform2f(this.modelPositionUniformLocation, position.x, position.y);
    this.gl.uniform2f(this.modelSizeUniformLocation, size.x, size.y);
    
    // Pass sprite-sheet-related uniforms
    const dimensions = this.textureDimensions.get(texture);
    if (dimensions) {
        this.gl.uniform2f(this.spriteSheetSizeUniformLocation, dimensions.width, dimensions.height);
    }
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

  public drawScene(cameraPosition: Vec2, playerPosition: Vec2, playerSize: Vec2, platforms: Platform[], playerTexture: WebGLTexture | null, platformTexture: WebGLTexture | null, playerAnim: AnimationState | null) {
    this.gl.clearColor(0.1, 0.1, 0.1, 1.0); this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.useProgram(this.program);
    this.gl.uniform2f(this.cameraPositionUniformLocation, cameraPosition.x, cameraPosition.y);
    this.gl.enable(this.gl.BLEND); this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

    if (platformTexture) {
        const platformTextureSize = this.textureDimensions.get(platformTexture) || { width: 128, height: 32 };
        for (const platform of platforms) {
            this.drawSprite(platform.position, platform.size, platformTexture, { x: platformTextureSize.width, y: platformTextureSize.height }, { x: platformTextureSize.width, y: platformTextureSize.height }, {x:0, y:0}, false);
        }
    }

    if (playerTexture && playerAnim) {
      const frameSize = { x: 64, y: 64 };
      const sheetDimensions = this.textureDimensions.get(playerTexture) || { width: 192, height: 192 };
      const sheetSize = { x: sheetDimensions.width, y: sheetDimensions.height };
      let frameX = 0;
      let frameY = 0;
      const idleFrames = [0, 2]; // Simple 2-frame idle
      const runFrames = [0, 1, 2, 3]; // 4-frame run
      const jumpFrames = [0]; // Single jump frame

      if (playerAnim.currentState === "idle") {
        frameY = 0;
        const frameIndex = playerAnim.currentFrame % idleFrames.length;
        frameX = idleFrames[frameIndex];
      } else if (playerAnim.currentState === "run") {
        frameY = 1;
        const frameIndex = playerAnim.currentFrame % runFrames.length;
        frameX = runFrames[frameIndex];
      } else if (playerAnim.currentState === "jump") {
        frameY = 2;
        const frameIndex = playerAnim.currentFrame % jumpFrames.length;
        frameX = jumpFrames[frameIndex];
      }

      const frameCoord = { x: frameX * frameSize.x, y: frameY * frameSize.y };
      this.drawSprite(playerPosition, playerSize, playerTexture, sheetSize, frameSize, frameCoord, playerAnim.facingLeft);
    }
  }
}
