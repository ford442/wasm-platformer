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
