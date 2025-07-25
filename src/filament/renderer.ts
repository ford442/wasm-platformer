// src/filament/renderer.ts
import { default as Filament, Destroyable, FilamentAsset, Camera, Engine, Entity, EntityManager, IndirectLight, Material, MaterialInstance, RenderableManager, Scene, Skinning, SwapChain, Texture, TextureSampler, TransformManager, View } from "filament";

// Define the structure of the render data we expect from the C++ WASM module.
export type RenderData = {
    buffer: ArrayBuffer;
    player: {
        x: number;
        y: number;
        vx: number;
        vy: number;
        isJumping: boolean;
        isFacingLeft: boolean;
        animFrame: number;
    };
    platforms: {
        count: number;
        // Other platform data if needed in the future
    };
};

const RENDER_TYPE_PLAYER = 0;
const RENDER_TYPE_PLATFORM = 1;

// A simple utility class to manage Filament entities for our sprites.
class Sprite {
    private static readonly vec3 = new Float32Array(3);
    private static readonly quat = new Float32Array(4);
    entity: Entity;
    tcm: TransformManager;
    sm: RenderableManager;

    constructor(entity: Entity, tcm: TransformManager, sm: RenderableManager) {
        this.entity = entity;
        this.tcm = tcm;
        this.sm = sm;
    }

    set_position(x: number, y: number, z: number) {
        const tcm = this.tcm;
        const inst = tcm.getInstance(this.entity);
        Sprite.vec3[0] = x;
        Sprite.vec3[1] = y;
        Sprite.vec3[2] = z;
        tcm.setTransform(inst, Sprite.vec3, Sprite.quat);
    }
}

export class FilamentRenderer {
    private canvas: HTMLCanvasElement;
    private engine: Engine | null = null;
    private scene: Scene | null = null;
    private view: View | null = null;
    private camera: Camera | null = null;
    private swapChain: SwapChain | null = null;

    // Asset properties
    private unlitMaterial: Material | null = null;
    private playerTexture: Texture | null = null;
    private platformTexture: Texture | null = null;
    private playerMaterialInstance: MaterialInstance | null = null;
    private platformMaterialInstance: MaterialInstance | null = null;

    // Entity-related properties
    private entities: Entity[] = [];
    private sprites: Sprite[] = [];
    private quadVertexBuffer: RenderableManager.VertexBuffer | null = null;
    private quadIndexBuffer: RenderableManager.IndexBuffer | null = null;


    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    // Main initialization method
    async initialize() {
        // Load Filament's WASM module and assets
        await Filament.init(['filament-wasm.wasm'], {
            // Tell Filament where to find its IBL asset
            ibl: 'ibl.ktx'
        });

        this.engine = Engine.create(this.canvas);
        this.scene = this.engine.createScene();
        this.swapChain = this.engine.createSwapChain();
        this.view = this.engine.createView();
        this.camera = this.engine.createCamera(EntityManager.get().create());

        this.view.setCamera(this.camera);
        this.view.setScene(this.scene);

        // Set up an orthographic projection for our 2D game
        this.resize();
        window.addEventListener('resize', () => this.resize(), false);

        // Load all game assets
        await this.loadAssets();

        // Create the geometry for our sprites (a simple quad)
        this.createQuadGeometry();
    }

    // Loads materials and textures
     private async loadAssets() {
        if (!this.engine) return;

        const materialBlob = await (await fetch('materials/unlit_textured.filamat')).blob();
        this.unlitMaterial = await this.engine.createMaterial(await materialBlob.arrayBuffer());

        this.playerTexture = await this.loadTexture('wazzy_spritesheet.png');
        this.platformTexture = await this.loadTexture('platform.png');

        this.playerMaterialInstance = this.unlitMaterial.createInstance('Player Material');
        this.platformMaterialInstance = this.unlitMaterial.createInstance('Platform Material');

        const sampler = new TextureSampler('nearest', 'nearest', 'clamp-to-edge');

        // Set the texture parameter (the old problematic 'baseColor' lines are now gone)
        this.playerMaterialInstance.setParameter('baseColorMap', this.playerTexture, sampler);
        this.platformMaterialInstance.setParameter('baseColorMap', this.platformTexture, sampler);
    }

    // Helper to load a PNG and create a Filament Texture
    private async loadTexture(url: string): Promise<Texture> {
        const response = await fetch(url);
        const image = await createImageBitmap(await response.blob());
        const texture = this.engine!.createTexture(image, {
            format: 'rgba8',
            usage: 'color_attachment',
            mipLevels: 1,
        });
        return texture;
    }

    // Creates vertex and index buffers for a 1x1 quad
    private createQuadGeometry() {
        if (!this.engine) return;

        const POS_UV = new Float32Array([
            // Position (x,y,z)  UV (u,v)
            -0.5, -0.5, 0.0,       0.0, 1.0, // bottom-left
             0.5, -0.5, 0.0,       1.0, 1.0, // bottom-right
            -0.5,  0.5, 0.0,       0.0, 0.0, // top-left
             0.5,  0.5, 0.0,       1.0, 0.0, // top-right
        ]);

        const INDICES = new Uint16Array([
            0, 1, 2, 2, 1, 3
        ]);

        const vertexBuffer = RenderableManager.VertexBuffer.Builder()
            .vertexCount(4)
            .bufferCount(1)
            .attribute(RenderableManager.VertexAttribute.POSITION, 0, 'float3', 0, 20)
            .attribute(RenderableManager.VertexAttribute.UV0, 0, 'float2', 12, 20)
            .build(this.engine);
        vertexBuffer.setBufferAt(this.engine, 0, POS_UV);
        this.quadVertexBuffer = vertexBuffer;
        
        const indexBuffer = RenderableManager.IndexBuffer.Builder()
            .indexCount(6)
            .bufferType('ushort')
            .build(this.engine);
        indexBuffer.setBuffer(this.engine, INDICES);
        this.quadIndexBuffer = indexBuffer;
    }

    // Main draw call for each frame
    public draw(renderData: RenderData, renderer: Filament.Renderer) {
        if (!this.engine || !this.scene || !this.view || !this.quadVertexBuffer || !this.quadIndexBuffer) return;

        // Clear previous frame's entities from the scene
        for (const entity of this.entities) {
            this.scene.remove(entity);
            this.engine.destroy(entity); // Also destroy the entity itself
        }
        this.entities = [];
        this.sprites = [];

        const renderableView = new DataView(renderData.buffer);
        const numObjects = renderableView.getUint32(0, true);
        let offset = 4;

        for (let i = 0; i < numObjects; i++) {
            const type = renderableView.getFloat32(offset, true);
            const x = renderableView.getFloat32(offset + 4, true);
            const y = renderableView.getFloat32(offset + 8, true);
            const w = renderableView.getFloat32(offset + 12, true);
            const h = renderableView.getFloat32(offset + 16, true);
            const u0 = renderableView.getFloat32(offset + 20, true);
            const v0 = renderableView.getFloat32(offset + 24, true);
            const u1 = renderableView.getFloat32(offset + 28, true);
            const v1 = renderableView.getFloat32(offset + 32, true);
            offset += 36;
            
            let materialInstance = null;
            if (type === RENDER_TYPE_PLAYER) {
                materialInstance = this.playerMaterialInstance;
            } else if (type === RENDER_TYPE_PLATFORM) {
                materialInstance = this.platformMaterialInstance;
            }

            if (!materialInstance) continue;

            // Create a new entity for this sprite
            const entity = EntityManager.get().create();
            this.entities.push(entity);
            
            // Create a renderable for the entity (the quad)
            new RenderableManager.Builder(1)
                .boundingBox({ center: [0, 0, 0], halfExtent: [0.5, 0.5, 0.02] })
                .material(0, materialInstance)
                .geometry(0, 'triangles', this.quadVertexBuffer, this.quadIndexBuffer)
                .build(this.engine, entity);

            this.scene.addEntity(entity);

            // Set the entity's transform (position and scale)
            const tcm = this.engine.getTransformManager();
            const inst = tcm.getInstance(entity);
            tcm.setTransform(inst, [x, y, 0], [0, 0, 0, 1]);
            tcm.setScale(inst, [w, h, 1]);
        }

        renderer.render(this.swapChain!, this.view);
    }

    // Handle window resizing to adjust the camera projection
    public resize() {
        if (!this.camera || !this.view) return;
        const dpr = window.devicePixelRatio;
        const width = this.canvas.width = this.canvas.clientWidth * dpr;
        const height = this.canvas.height = this.canvas.clientHeight * dpr;
        this.view.setViewport([0, 0, width, height]);

        const aspect = width / height;
        const V_HEIGHT = 10; // Viewport height in world units
        const V_WIDTH = V_HEIGHT * aspect;

        // Orthographic projection
        this.camera.setProjection('ortho', -V_WIDTH/2, V_WIDTH/2, -V_HEIGHT/2, V_HEIGHT/2, 0, 10);
    }

    public getEngine(): Engine | null {
        return this.engine;
    }
}
