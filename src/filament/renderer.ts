// src/filament/renderer.ts
import { default as Filament, Camera, Engine, Entity, EntityManager, Material, MaterialInstance, Renderer, Scene, SwapChain, Texture, TextureSampler, TransformManager, View } from "filament";
import { mat4 } from 'gl-matrix';

type BufferReference = Uint8Array | Uint16Array | Float32Array;

export type RenderData = {
    buffer: ArrayBuffer;
};

const RENDER_TYPE_PLAYER = 0;

export class FilamentRenderer {
    private canvas: HTMLCanvasElement;
    private engine!: Engine;
    private scene!: Scene;
    private view!: View;
    private camera!: Camera;
    private swapChain!: SwapChain;
    private renderer!: Renderer;

    private unlitMaterial!: Material;
    private playerTexture!: Texture;
    private platformTexture!: Texture;
    private playerMaterialInstance!: MaterialInstance;
    private platformMaterialInstance!: MaterialInstance;

    private entities: Entity[] = [];
    private quadVertexBuffer!: Filament.VertexBuffer;
    private quadIndexBuffer!: Filament.IndexBuffer;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    async initialize() {
        const assetPath = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
        await Filament.init([`${assetPath}/filament-wasm.wasm`]);

        this.engine = Engine.create(this.canvas);
        this.scene = this.engine.createScene();
        this.swapChain = this.engine.createSwapChain();
        this.renderer = this.engine.createRenderer();
        this.view = this.engine.createView();
        this.camera = this.engine.createCamera(EntityManager.get().create());

        this.view.setCamera(this.camera);
        this.view.setScene(this.scene);

        this.resize();
        window.addEventListener('resize', () => this.resize(), false);

        await this.loadAssets();
        this.createQuadGeometry();
    }

    private async loadAssets() {
        const materialBlob = await (await fetch('materials/unlit_textured.filamat')).arrayBuffer();
        this.unlitMaterial = this.engine.createMaterial(new Uint8Array(materialBlob));

        this.playerTexture = await this.loadTexture('wazzy_spritesheet.png');
        this.platformTexture = await this.loadTexture('platform.png');

        this.playerMaterialInstance = this.unlitMaterial.createInstance();
        this.platformMaterialInstance = this.unlitMaterial.createInstance();

        const sampler = new TextureSampler(Filament.MinFilter.NEAREST, Filament.MagFilter.NEAREST, Filament.WrapMode.CLAMP_TO_EDGE);
        
        this.playerMaterialInstance.setTextureParameter('baseColorMap', this.playerTexture, sampler);
        this.platformMaterialInstance.setTextureParameter('baseColorMap', this.platformTexture, sampler);
    }

    private async loadTexture(url: string): Promise<Texture> {
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
        // Remove the entities from the scene, but do not manually destroy them.
        for (const entity of this.entities) {
            this.scene.remove(entity);
        }
        // Clear our local array. The garbage collector will handle the JS objects.
        this.entities = [];

        const renderableView = new DataView(renderData.buffer);
        const numObjects = renderableView.getUint32(0, true);
        let offset = 4;

        for (let i = 0; i < numObjects; i++) {
            const type = renderableView.getFloat32(offset, true);
            const x = renderableView.getFloat32(offset + 4, true);
            const y = renderableView.getFloat32(offset + 8, true);
            const w = renderableView.getFloat32(offset + 12, true);
            const h = renderableView.getFloat32(offset + 16, true);
            offset += 36;
            
            let materialInstance = type === RENDER_TYPE_PLAYER ? this.playerMaterialInstance : this.platformMaterialInstance;
            const entity = EntityManager.get().create();
            this.entities.push(entity);
            
            new Filament.RenderableManager$Builder()
                .boundingBox({ center: [0, 0, 0], halfExtent: [0.5, 0.5, 0.02] })
                .material(0, materialInstance)
                .geometry(0, Filament.RenderableManager$PrimitiveType.TRIANGLES, this.quadVertexBuffer, this.quadIndexBuffer)
                .build(this.engine, entity);

            this.scene.addEntity(entity);

            const tcm = this.engine.getTransformManager();
            const inst = tcm.getInstance(entity);
            const transform = mat4.create();
            mat4.translate(transform, transform, [x, y, 0]);
            mat4.scale(transform, transform, [w, h, 1]);
            tcm.setTransform(inst, transform as unknown as number[]);
        }

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
