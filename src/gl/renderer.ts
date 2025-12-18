export class Renderer {
    private gl: WebGL2RenderingContext;
    private spriteProgram: WebGLProgram;
    private backgroundProgram: WebGLProgram;
    private spriteVao: WebGLVertexArrayObject;
    private backgroundVao: WebGLVertexArrayObject;
    private spriteBuffer: WebGLBuffer;
    private backgroundBuffer: WebGLBuffer;
    private texture: WebGLTexture | null = null;
    private canvas: HTMLCanvasElement;

    // Uniform locations
    private spriteResolutionLocation: WebGLUniformLocation | null;
    private spriteTextureLocation: WebGLUniformLocation | null;
    private bgResolutionLocation: WebGLUniformLocation | null;
    private bgCameraLocation: WebGLUniformLocation | null;

    constructor(canvas: HTMLCanvasElement, spriteVsSource: string, spriteFsSource: string, bgVsSource: string, bgFsSource:string) {
        this.canvas = canvas;
        const gl = canvas.getContext('webgl2');
        if (!gl) {
            throw new Error('WebGL 2 not supported');
        }
        this.gl = gl;

        this.spriteProgram = this.createProgram(spriteVsSource, spriteFsSource);
        this.backgroundProgram = this.createProgram(bgVsSource, bgFsSource);

        this.spriteResolutionLocation = gl.getUniformLocation(this.spriteProgram, "u_resolution");
        this.spriteTextureLocation = gl.getUniformLocation(this.spriteProgram, "u_texture");
        this.bgResolutionLocation = gl.getUniformLocation(this.backgroundProgram, "u_resolution");
        this.bgCameraLocation = gl.getUniformLocation(this.backgroundProgram, "u_camera");

        this.spriteVao = this.gl.createVertexArray()!;
        this.gl.bindVertexArray(this.spriteVao);
        this.spriteBuffer = this.gl.createBuffer()!;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.spriteBuffer);
        this.gl.enableVertexAttribArray(0);
        this.gl.vertexAttribPointer(0, 4, this.gl.FLOAT, false, 8 * 4, 0); // x, y, w, h
        this.gl.enableVertexAttribArray(1);
        this.gl.vertexAttribPointer(1, 4, this.gl.FLOAT, false, 8 * 4, 4 * 4); // u, v, uw, vh
        
        this.backgroundVao = this.gl.createVertexArray()!;
        this.gl.bindVertexArray(this.backgroundVao);
        this.backgroundBuffer = this.gl.createBuffer()!;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.backgroundBuffer);
        this.gl.enableVertexAttribArray(0);
        this.gl.vertexAttribPointer(0, 4, this.gl.FLOAT, false, 0, 0);

        this.gl.bindVertexArray(null);
    }

    // NEW: Asynchronous init method
    public async init() {
        this.texture = await this.loadTexture('wazzy_spritesheet.png');
        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    }

    public draw(spriteData: any, backgroundData: any) {
        this.gl.clearColor(0.1, 0.1, 0.15, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        // Draw background
        this.gl.useProgram(this.backgroundProgram);
        this.gl.bindVertexArray(this.backgroundVao);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.backgroundBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, backgroundData, this.gl.DYNAMIC_DRAW);
        this.gl.uniform2f(this.bgResolutionLocation, this.canvas.width, this.canvas.height);
        this.gl.uniform2f(this.bgCameraLocation, spriteData[0] / 2, spriteData[1] / 2); // Simple camera logic
        this.gl.drawArrays(this.gl.POINTS, 0, backgroundData.length / 4);

        // Draw sprites
        this.gl.useProgram(this.spriteProgram);
        this.gl.bindVertexArray(this.spriteVao);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.uniform1i(this.spriteTextureLocation, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.spriteBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, spriteData, this.gl.DYNAMIC_DRAW);
        this.gl.uniform2f(this.spriteResolutionLocation, this.canvas.width, this.canvas.height);
        this.gl.drawArrays(this.gl.POINTS, 0, spriteData.length / 8);
    }
    
    private createShader(type: number, source: string): WebGLShader {
        const shader = this.gl.createShader(type)!;
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
            throw new Error(`Shader compile error: ${this.gl.getShaderInfoLog(shader)}`);
        }
        return shader;
    }

    private createProgram(vsSource: string, fsSource: string): WebGLProgram {
        const vs = this.createShader(this.gl.VERTEX_SHADER, vsSource);
        const fs = this.createShader(this.gl.FRAGMENT_SHADER, fsSource);
        const program = this.gl.createProgram()!;
        this.gl.attachShader(program, vs);
        this.gl.attachShader(program, fs);
        this.gl.linkProgram(program);
        if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            throw new Error(`Program link error: ${this.gl.getProgramInfoLog(program)}`);
        }
        return program;
    }

    private loadTexture(url: string): Promise<WebGLTexture> {
        return new Promise((resolve) => {
            const texture = this.gl.createTexture()!;
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 255, 255])); // Temp pixel

            const image = new Image();
            image.onload = () => {
                this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
                this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
                resolve(texture);
            };
            image.src = url;
        });
    }
}
