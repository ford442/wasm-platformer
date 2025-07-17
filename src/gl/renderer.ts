import vertexShaderSource from './shaders/basic.vert.glsl?raw';
import fragmentShaderSource from './shaders/basic.frag.glsl?raw';

// This interface is defined in the loader, but we can redefine it here
// for clarity or import it.
interface LocalPosition {
  x: number;
  y: number;
}

export class Renderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private positionAttributeLocation: number;
  private modelPositionUniformLocation: WebGLUniformLocation | null;
  // FIX: Initialize property to null to satisfy strict initialization rules.
  private positionBuffer: WebGLBuffer | null = null;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('webgl2');
    if (!context) throw new Error('WebGL2 is not supported.');
    this.gl = context;

    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
    this.program = this.createProgram(vertexShader, fragmentShader);

    this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.modelPositionUniformLocation = this.gl.getUniformLocation(this.program, 'u_model_position');

    this.gl.viewport(0, 0, canvas.width, canvas.height);
    this.setupGeometry();
  }

  private compileShader(type: number, source: string): WebGLShader {
    const shader = this.gl.createShader(type);
    if (!shader) throw new Error('Could not create shader.');
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const error = this.gl.getShaderInfoLog(shader);
      this.gl.deleteShader(shader);
      throw new Error(`Shader compilation failed: ${error}`);
    }
    return shader;
  }

  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
    const program = this.gl.createProgram();
    if (!program) throw new Error('Could not create shader program.');
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const error = this.gl.getProgramInfoLog(program);
      this.gl.deleteProgram(program);
      throw new Error(`Shader program linking failed: ${error}`);
    }
    return program;
  }

  private setupGeometry() {
    const positions = new Float32Array([-0.1,-0.1, 0.1,-0.1, -0.1,0.1, -0.1,0.1, 0.1,-0.1, 0.1,0.1]);
    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
  }

  public clear() {
    this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  public draw(modelPosition: LocalPosition) {
    this.clear();
    this.gl.useProgram(this.program);
    this.gl.uniform2f(this.modelPositionUniformLocation, modelPosition.x, modelPosition.y);
    this.gl.enableVertexAttribArray(this.positionAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }
}
