import type { Vec2, Platform } from '../wasm/loader';

export class Renderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  
  // Attribute locations
  private positionAttributeLocation: number;
  private texCoordAttributeLocation: number; // NEW

  // Uniform locations
  private modelPositionUniformLocation: WebGLUniformLocation | null;
  private modelSizeUniformLocation: WebGLUniformLocation | null;
  private cameraPositionUniformLocation: WebGLUniformLocation | null;
  private textureUniformLocation: WebGLUniformLocation | null; // NEW

  // Buffers
  private unitSquarePositionBuffer: WebGLBuffer | null = null;
  private unitSquareTexCoordBuffer: WebGLBuffer | null = null; // NEW

  constructor(canvas: HTMLCanvasElement, vertexShaderSource: string, fragmentShaderSource: string) {
    const context = canvas.getContext('webgl2');
    if (!context) throw new Error('WebGL2 is not supported.');
    this.gl = context;

    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
    this.program = this.createProgram(vertexShader, fragmentShader);

    // Get attribute and uniform locations from the new shaders
    this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.texCoordAttributeLocation = this.gl.getAttribLocation(this.program, 'a_texCoord');
    this.modelPositionUniformLocation = this.gl.getUniformLocation(this.program, 'u_model_position');
    this.modelSizeUniformLocation = this.gl.getUniformLocation(this.program, 'u_model_size');
    this.cameraPositionUniformLocation = this.gl.getUniformLocation(this.program, 'u_camera_position');
    this.textureUniformLocation = this.gl.getUniformLocation(this.program, 'u_texture');

    this.gl.viewport(0, 0, canvas.width, canvas.height);
    this.setupUnitSquare();
  }

  // NEW: Asynchronous method to load an image and create a WebGL texture
  public async loadTexture(url: string): Promise<WebGLTexture> {
    const texture = this.gl.createTexture();
    if (!texture) {
      throw new Error('Could not create texture');
    }

    // Set a temporary 1x1 blue pixel so we can use the texture immediately
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255]));

    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = url;
      image.onload = () => {
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
        this.gl.generateMipmap(this.gl.TEXTURE_2D); // Helps with scaling quality
        resolve(texture);
      };
      image.onerror = (err) => {
        reject(`Failed to load texture from ${url}: ${err}`);
      };
    });
  }

  private setupUnitSquare() {
    // Position buffer (same as before)
    const positions = new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5]);
    this.unitSquarePositionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.unitSquarePositionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

    // NEW: Texture coordinate buffer
    // (0,0) is top-left, (1,1) is bottom-right of the texture
    const texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0]);
    this.unitSquareTexCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.unitSquareTexCoordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.STATIC_DRAW);
  }

  private drawSprite(position: Vec2, size: Vec2, texture: WebGLTexture) {
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.uniform1i(this.textureUniformLocation, 0); // Use texture unit 0

    this.gl.uniform2f(this.modelPositionUniformLocation, position.x, position.y);
    this.gl.uniform2f(this.modelSizeUniformLocation, size.x, size.y);
    
    // Set up position attribute
    this.gl.enableVertexAttribArray(this.positionAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.unitSquarePositionBuffer);
    this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);

    // Set up texture coordinate attribute
    this.gl.enableVertexAttribArray(this.texCoordAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.unitSquareTexCoordBuffer);
    this.gl.vertexAttribPointer(this.texCoordAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }
  
public drawScene(cameraPosition: Vec2, playerPosition: Vec2, playerSize: Vec2, platforms: Platform[], playerTexture: WebGLTexture | null, platformTexture: WebGLTexture | null) {
    this.clear();
    this.gl.useProgram(this.program);
    this.gl.uniform2f(this.cameraPositionUniformLocation, cameraPosition.x, cameraPosition.y);
    // Enable blending for transparency
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

 private compileShader(type: number, source: string): WebGLShader { /* ... */ return this.gl.createShader(type)!; }
  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram { /* ... */ return this.gl.createProgram()!; }
  public clear() { this.gl.clearColor(0.1, 0.1, 0.1, 1.0); this.gl.clear(this.gl.COLOR_BUFFER_BIT); }
}
