// Import the shader source code.
// Note: You might need to configure your build tool (like Vite) to handle raw file imports.
// A common way is to add `?raw` to the import path.
import vertexShaderSource from './shaders/basic.vert.glsl?raw';
import fragmentShaderSource from './shaders/basic.frag.glsl?raw';

/**
 * Manages the WebGL2 rendering context, shader programs, and drawing operations.
 */
export class Renderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;

  /**
   * Initializes the Renderer by getting the WebGL2 context and setting up the shader program.
   * @param canvas The HTML canvas element to render to.
   */
  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('webgl2');
    if (!context) {
      throw new Error('WebGL2 is not supported in this browser.');
    }
    this.gl = context;

    // Compile shaders and link them into a program
    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
    this.program = this.createProgram(vertexShader, fragmentShader);

    // Set the viewport to match the canvas size
    this.gl.viewport(0, 0, canvas.width, canvas.height);
  }

  /**
   * Compiles a shader from source code.
   * @param type The type of shader (VERTEX_SHADER or FRAGMENT_SHADER).
   * @param source The GLSL source code for the shader.
   * @returns The compiled WebGLShader.
   */
  private compileShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type);
    if (!shader) {
      throw new Error('Could not create shader.');
    }

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    // Check for compilation errors
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const error = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(`Shader compilation failed: ${error}`);
    }

    return shader;
  }

  /**
   * Links a vertex and fragment shader into a WebGLProgram.
   * @param vertexShader The compiled vertex shader.
   * @param fragmentShader The compiled fragment shader.
   * @returns The linked WebGLProgram.
   */
  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
    const program = this.gl.createProgram();
    if (!program) {
      throw new Error('Could not create shader program.');
    }

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    // Check for linking errors
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const error = this.gl.getProgramInfoLog(program);
      this.gl.deleteProgram(program);
      throw new Error(`Shader program linking failed: ${error}`);
    }

    return program;
  }

  /**
   * Clears the canvas to a specific color.
   */
  public clear() {
    // Set the clear color (dark gray from our theme)
    this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
    // Clear the color buffer
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  /**
   * The main drawing function.
   */
  public draw() {
    this.clear();

    // Tell WebGL to use our shader program for subsequent drawing
    this.gl.useProgram(this.program);

    // --- Create a simple square to draw ---
    // A square is made of two triangles.
    // Coordinates are in clip space (-1.0 to 1.0)
    const positions = new Float32Array([
      -0.5, -0.5, // Triangle 1, Vertex 1
       0.5, -0.5, // Triangle 1, Vertex 2
      -0.5,  0.5, // Triangle 1, Vertex 3
      -0.5,  0.5, // Triangle 2, Vertex 1
       0.5, -0.5, // Triangle 2, Vertex 2
       0.5,  0.5, // Triangle 2, Vertex 3
    ]);

    // Create a buffer on the GPU to hold the positions
    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

    // Find the location of our 'a_position' attribute in the shader program
    const positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');
    
    // Tell WebGL how to pull data out of the buffer and into the attribute
    this.gl.enableVertexAttribArray(positionAttributeLocation);
    this.gl.vertexAttribPointer(
      positionAttributeLocation,
      2,        // 2 components per iteration (x, y)
      this.gl.FLOAT, // The data is 32bit floats
      false,    // Don't normalize the data
      0,        // 0 = move forward size * sizeof(type) each iteration to get the next position
      0         // 0 = start at the beginning of the buffer
    );

    // Finally, draw the geometry!
    const primitiveType = this.gl.TRIANGLES;
    const offset = 0;
    const count = 6; // 6 vertices to draw our square (2 triangles * 3 vertices)
    this.gl.drawArrays(primitiveType, offset, count);
  }
}
