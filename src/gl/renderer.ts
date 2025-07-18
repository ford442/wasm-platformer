/*
================================================================================
  FILE: src/gl/renderer.ts (Updated)
================================================================================
*/
import vertexShaderSource from './shaders/basic.vert.glsl?raw';
import fragmentShaderSource from './shaders/basic.frag.glsl?raw';

import type { Vec2, Platform } from '../wasm/loader';

export class Renderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private positionAttributeLocation: number;
  private modelPositionUniformLocation: WebGLUniformLocation | null;
  private modelSizeUniformLocation: WebGLUniformLocation | null;
  private colorUniformLocation: WebGLUniformLocation | null;
  private unitSquareBuffer: WebGLBuffer | null = null;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('webgl2');
    if (!context) throw new Error('WebGL2 is not supported.');
    this.gl = context;

    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
    this.program = this.createProgram(vertexShader, fragmentShader);

    this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.modelPositionUniformLocation = this.gl.getUniformLocation(this.program, 'u_model_position');
    this.modelSizeUniformLocation = this.gl.getUniformLocation(this.program, 'u_model_size');
    this.colorUniformLocation = this.gl.getUniformLocation(this.program, 'u_color');

    this.gl.viewport(0, 0, canvas.width, canvas.height);
    this.setupUnitSquare();
  }

  private compileShader(type: number, source: string): WebGLShader {
      const shader = this.gl.createShader(type);
      if (!shader) {
          throw new Error("Could not create shader");
      }
      this.gl.shaderSource(shader, source);
      this.gl.compileShader(shader);
      if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
          const errorLog = this.gl.getShaderInfoLog(shader);
          this.gl.deleteShader(shader);
          throw new Error(`Shader compilation failed: ${errorLog}`);
      }
      return shader;
  }
  
  private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
      const program = this.gl.createProgram();
      if (!program) {
          throw new Error("Could not create program");
      }
      this.gl.attachShader(program, vertexShader);
      this.gl.attachShader(program, fragmentShader);
      this.gl.linkProgram(program);
      if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
          const errorLog = this.gl.getProgramInfoLog(program);
          this.gl.deleteProgram(program);
          throw new Error(`Program linking failed: ${errorLog}`);
      }
      return program;
  }

  private setupUnitSquare() {
    const positions = new Float32Array([-0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5]);
    this.unitSquareBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.unitSquareBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
  }

  public clear() {
    this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  private drawRect(position: Vec2, size: Vec2, color: [number, number, number, number]) {
    this.gl.uniform2f(this.modelPositionUniformLocation, position.x, position.y);
    this.gl.uniform2f(this.modelSizeUniformLocation, size.x, size.y);
    this.gl.uniform4fv(this.colorUniformLocation, color);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  public drawScene(playerPosition: Vec2, playerSize: Vec2, platforms: Platform[]) {
    this.clear();
    this.gl.useProgram(this.program);
    this.gl.enableVertexAttribArray(this.positionAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.unitSquareBuffer);
    this.gl.vertexAttribPointer(this.positionAttributeLocation, 2, this.gl.FLOAT, false, 0, 0);
    for (const platform of platforms) {
      this.drawRect(platform.position, platform.size, [0.5, 0.5, 0.5, 1.0]);
    }
    this.drawRect(playerPosition, playerSize, [0.0, 0.67, 1.0, 1.0]);
  }
}
