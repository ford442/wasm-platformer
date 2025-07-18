/*
================================================================================
  FILE: src/gl/renderer.ts (Updated)
================================================================================
*/
import vertexShaderSource from './shaders/basic.vert.glsl?raw';
import fragmentShaderSource from './shaders/basic.frag.glsl?raw';

// Interfaces to match the C++ structs
export interface Vec2 {
  x: number;
  y: number;
}

export interface Platform {
  position: Vec2;
  size: Vec2;
}

export class Renderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private positionAttributeLocation: number;
  private modelPositionUniformLocation: WebGLUniformLocation | null;
  private modelSizeUniformLocation: WebGLUniformLocation | null; // New uniform for size
  private colorUniformLocation: WebGLUniformLocation | null; // New uniform for color
  
  // A single buffer for a unit square (1x1). We'll scale it with uniforms.
  private unitSquareBuffer: WebGLBuffer | null = null;

  constructor(canvas: HTMLCanvasElement) {
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

    this.gl.viewport(0, 0, canvas.width, canvas.height);
    this.setupUnitSquare();
  }

  // --- Private Helper Methods (compileShader, createProgram) remain the same ---
  private compileShader(type: number, source: string): WebGLShader { /* ... no changes ... */ return this.gl.createShader(type)!; }
  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram { /* ... no changes ... */ return this.gl.createProgram()!; }
  // --- End of Helper Methods ---

  /**
   * Sets up a generic 1x1 square. We will move and scale this square to draw all our objects.
   */
  private setupUnitSquare() {
    const positions = new Float32Array([
      -0.5, -0.5,   0.5, -0.5,  -0.5,  0.5,
      -0.5,  0.5,   0.5, -0.5,   0.5,  0.5,
    ]);
    this.unitSquareBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.unitSquareBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
  }

  public clear() {
    this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  /**
   * Generic function to draw a single rectangle with a specific position, size, and color.
   */
  private drawRect(position: Vec2, size: Vec2, color: [number, number, number, number]) {
    this.gl.uniform2f(this.modelPositionUniformLocation, position.x, position.y);
    this.gl.uniform2f(this.modelSizeUniformLocation, size.x, size.y);
    this.gl.uniform4fv(this.colorUniformLocation, color);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  /**
   * The main drawing function, now accepts player and platform data.
   */
  public drawScene(playerPosition: Vec2, playerSize: Vec2, platforms: Platform[]) {
    this.clear();
    this.gl.useProgram(this.program);

    // Set up the vertex buffer once for all draw calls in this frame
    this.gl.enableVertexAttribArray(this.positionAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.unitSquareBuffer);
    this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);

    // Draw all the platforms
    for (const platform of platforms) {
      this.drawRect(platform.position, platform.size, [0.5, 0.5, 0.5, 1.0]); // Gray color for platforms
    }

    // Draw the player
    this.drawRect(playerPosition, playerSize, [0.0, 0.67, 1.0, 1.0]); // Blue color for player
  }
}
