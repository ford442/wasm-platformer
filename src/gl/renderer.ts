/*
================================================================================
  FILE: src/gl/renderer.ts (Updated for Scrolling)
================================================================================
*/
// Note: The fragment shader does not need to be changed.

// Interfaces to match the C++ structs
export interface Vec2 { x: number; y: number; }
export interface Platform { position: Vec2; size: Vec2; }

export class Renderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private positionAttributeLocation: number;
  private modelPositionUniformLocation: WebGLUniformLocation | null;
  private modelSizeUniformLocation: WebGLUniformLocation | null;
  private colorUniformLocation: WebGLUniformLocation | null;
  // NEW: A location for the camera uniform
  private cameraPositionUniformLocation: WebGLUniformLocation | null;
  
  private unitSquareBuffer: WebGLBuffer | null = null;

  constructor(canvas: HTMLCanvasElement, vertexShaderSource: string, fragmentShaderSource: string) {
    const context = canvas.getContext('webgl2');
    if (!context) throw new Error('WebGL2 is not supported.');
    this.gl = context;

    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
    this.program = this.createProgram(vertexShader, fragmentShader);

    // Get attribute and uniform locations
    this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.modelPositionUniformLocation = this.gl.getUniformLocation(this.program, 'u_model_position');
    this.modelSizeUniformLocation = this.gl.getUniformLocation(this.program, 'u_model_size');
    this.colorUniformLocation = this.gl.getUniformLocation(this.program, 'u_color');
    // NEW: Get the location of the camera uniform from the shader
    this.cameraPositionUniformLocation = this.gl.getUniformLocation(this.program, 'u_camera_position');

    this.gl.viewport(0, 0, canvas.width, canvas.height);
    this.setupUnitSquare();
  }

  // ... (compileShader, createProgram, setupUnitSquare, clear, and drawRect methods remain the same)
  private compileShader(type: number, source: string): WebGLShader { /* ... */ return this.gl.createShader(type)!; }
  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram { /* ... */ return this.gl.createProgram()!; }
  private setupUnitSquare() { /* ... */ }
  public clear() { /* ... */ }
  private drawRect(position: Vec2, size: Vec2, color: [number, number, number, number]) { /* ... */ }

  /**
   * The main drawing function, now accepts camera data.
   */
  public drawScene(cameraPosition: Vec2, playerPosition: Vec2, playerSize: Vec2, platforms: Platform[]) {
    this.clear();
    this.gl.useProgram(this.program);

    // NEW: Set the camera position uniform once per frame.
    // This value will be used for all subsequent draw calls.
    this.gl.uniform2f(this.cameraPositionUniformLocation, cameraPosition.x, cameraPosition.y);

    // Set up the vertex buffer once for all draw calls in this frame
    this.gl.enableVertexAttribArray(this.positionAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.unitSquareBuffer);
    this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);

    // Draw all the platforms
    for (const platform of platforms) {
      this.drawRect(platform.position, platform.size, [0.5, 0.5, 0.5, 1.0]);
    }

    // Draw the player
    this.drawRect(playerPosition, playerSize, [0.0, 0.67, 1.0, 1.0]);
  }
}
