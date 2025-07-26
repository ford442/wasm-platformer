// src/filament/renderer.ts
import Filament from "filament"; // Simplified, more robust import
import { mat4 } from 'gl-matrix';

// This is an alias for the expected buffer type.
type BufferReference = Uint8Array | Uint16Array | Float32Array;

export type RenderData = {
    buffer: ArrayBuffer;
};

const RENDER_TYPE_PLAYER = 0;

export class FilamentRenderer {
    private canvas: HTMLCanvasElement;
    // All types are now prefixed with Filament.
    private engine!: Filament.Engine;
    private scene!: Filament.Scene;
    private view!: Filament.View;
    private camera!: Filament.Camera;
    private swapChain!: Filament.SwapChain;
    private renderer!: Filament.Renderer;

    private unlitMaterial!: Filament.Material;
    private playerTexture!: Filament.Texture;
    private platformTexture!: Filament.Texture;
    private playerMaterialInstance!: Filament.MaterialInstance;
    private platformMaterialInstance!: Filament.MaterialInstance;

    private entities: Filament.Entity[] = [];
    private quadVertexBuffer!: Filament.VertexBuffer;
    private quadIndexBuffer!: Filament.IndexBuffer;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    async initialize() {
        const assetPath = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
        await Filament.init([`${assetPath}/filament.wasm`]);

        // All static access is now prefixed with Filament.
        this.engine = Filament.Engine.create(this.canvas);

        this.scene = this.engine.createScene();
        this.swapChain = this.engine.createSwapChain();
        this.renderer = this.engine.createRenderer();
        this.view = this.engine.createView();
        this.camera = this.engine.createCamera(Filament.EntityManager.get().create());

        const light = Filament.EntityManager.get().create();
        
        new Filament.LightManager$Builder()
            .color([0.7, 0.7, 0.7])
            .intensity(50000.0)
            .direction([0, -1, 0])
            .castShadows(false)
            .build(this.engine, light);
        this.scene.addEntity(light);

        this.view.setCamera(this.camera);
        this.view.setScene(this.scene);
/*
        this.resize();
        window.addEventListener('resize', () => this.resize(), false);

        await this.loadAssets();
        this.createQuadGeometry();
*/
    }

    private async loadAssets() {
        const materialBlob = await (await fetch('materials/unlit_textured.filamat')).arrayBuffer();
        this.unlitMaterial = this.engine.createMaterial(new Uint8Array(materialBlob));

        this.playerTexture = await this.loadTexture('wazzy_spritesheet.png');
        this.platformTexture = await this.loadTexture('platform.png');

        this.playerMaterialInstance = this.unlitMaterial.createInstance();
        this.platformMaterialInstance = this.unlitMaterial.createInstance();

        const sampler = new Filament.TextureSampler(Filament.MinFilter.NEAREST, Filament.MagFilter.NEAREST, Filament.WrapMode.CLAMP_TO_EDGE);
        
        this.playerMaterialInstance.setTextureParameter('baseColorMap', this.playerTexture, sampler);
        this.platformMaterialInstance.setTextureParameter('baseColorMap', this.platformTexture, sampler);
    }

    private async loadTexture(url: string): Promise<Filament.Texture> {
        const response = await fetch(url);
        const image = await createImageBitmap(await response.blob());
        
        const usage = 0x1; // Corresponds to TextureUsage.COLOR_ATTACHMENT

        const texture = new Filament.Texture$Builder()
            .width(image.width)
            .height(image.height)
            .levels(1)
            .usage(usage)
            .format(Filament.Texture$InternalFormat.RGBA8)
            .build(this.engine);
        
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, image.width, image.height);
        
        const pixelBuffer = {
            buffer: imageData.data.buffer,
            width: image.width,
            height: image.height,
            format: 'rgba',
            type: 'ubyte'
        };

        texture.setImage(this.engine, 0, pixelBuffer as unknown as Filament.driver$PixelBufferDescriptor);
        return texture;
    }
    
    private createQuadGeometry() {
        const POS_UV = new Float32Array([-0.5,-0.5,0,0,1, 0.5,-0.5,0,1,1, -0.5,0.5,0,0,0, 0.5,0.5,0,1,0]);
        const INDICES = new Uint16Array([0, 1, 2, 2, 1, 3]);

        this.quadVertexBuffer = new Filament.VertexBuffer$Builder()
            .vertexCount(4).bufferCount(1)
            .attribute(Filament.VertexAttribute.POSITION, 0, Filament.VertexBuffer$AttributeType.FLOAT3, 0, 20)
            .attribute(Filament.VertexAttribute.UV0, 0, Filament.VertexBuffer$AttributeType.FLOAT2, 12, 20)
            .build(this.engine);
        this.quadVertexBuffer.setBufferAt(this.engine, 0, POS_UV);

        this.quadIndexBuffer = new Filament.IndexBuffer$Builder()
            .indexCount(6).bufferType(Filament.IndexBuffer$IndexType.USHORT).build(this.engine);
        this.quadIndexBuffer.setBuffer(this.engine, INDICES);
    }

    public draw(renderData: RenderData) {
        if (this.entities.length > 0) {
            this.scene.removeEntities(this.entities);
        }
        this.entities = [];

        const renderableView = new DataView(renderData.buffer);
        const numObjects = renderableView.getUint32(0, true);
        let offset = 4;

        let newEntities: Filament.Entity[] = [];
        for (let i = 0; i < numObjects; i++) {
            const type = renderableView.getFloat32(offset, true);
            const x = renderableView.getFloat32(offset + 4, true);
            const y = renderableView.getFloat32(offset + 8, true);
            const w = renderableView.getFloat32(offset + 12, true);
            const h = renderableView.getFloat32(offset + 16, true);
            offset += 36;
            
            let materialInstance = type === RENDER_TYPE_PLAYER ? this.playerMaterialInstance : this.platformMaterialInstance;
            const entity = Filament.EntityManager.get().create();
            newEntities.push(entity);
            
            new Filament.RenderableManager$Builder()
                .boundingBox({ center: [0, 0, 0], halfExtent: [0.5, 0.5, 0.02] })
                .material(0, materialInstance)
                .geometry(0, Filament.RenderableManager$PrimitiveType.TRIANGLES, this.quadVertexBuffer, this.quadIndexBuffer)
                .build(this.engine, entity);

            const tcm = this.engine.getTransformManager();
            const inst = tcm.getInstance(entity);
            const transform = mat4.create();
            mat4.translate(transform, transform, [x, y, 0]);
            mat4.scale(transform, transform, [w, h, 1]);
            tcm.setTransform(inst, transform as unknown as number[]);
        }

        if (newEntities.length > 0) {
            this.scene.addEntities(newEntities);
        }
        this.entities = newEntities;

        if (this.renderer.beginFrame(this.swapChain)) {
            this.renderer.render(this.swapChain, this.view);
            this.renderer.endFrame();
        }
    }

    public resize() {
        const dpr = window.devicePixelRatio;
        const width = this.canvas.width = this.canvas.clientWidth * dpr;
        const height = this.canvas.height = this.canvas.clientHeight * dpr;
        this.view.setViewport([0, 0, width, height]);

        const aspect = width / height;
        const V_HEIGHT = 10;
        const V_WIDTH = V_HEIGHT * aspect;
        this.camera.setProjection(Filament.Camera$Projection.ORTHO, -V_WIDTH/2, V_WIDTH/2, -V_HEIGHT/2, V_HEIGHT/2, 0, 10);
    }
}
