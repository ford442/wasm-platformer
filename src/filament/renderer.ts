// src/filament/renderer.ts
import { default as Filament, Camera, Engine, Entity, EntityManager, IndirectLight, Material, MaterialInstance, RenderableManager, Scene, SwapChain, Texture, TextureSampler, TransformManager, View } from "filament";

// Define the structure of the render data from WASM.
export type RenderData = {
    buffer: ArrayBuffer;
};

const RENDER_TYPE_PLAYER = 0;
const RENDER_TYPE_PLATFORM = 1;

export class FilamentRenderer {
    private canvas: HTMLCanvasElement;
    private engine: Engine;
    private scene: Scene;
    private view: View;
    private camera: Camera;
    private swapChain: SwapChain;

    // Asset properties
    private unlitMaterial: Material | null = null;
    private playerTexture: Texture | null = null;
    private platformTexture: Texture | null = null;
    private playerMaterialInstance: MaterialInstance | null = null;
    private platformMaterialInstance: MaterialInstance | null = null;

    // Entity-related properties
    private entities: Entity[] = [];
    private quadVertexBuffer: RenderableManager$VertexBuffer | null = null;
    private quadIndexBuffer: RenderableManager$IndexBuffer | null = null;


    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    // Main initialization method
    async initialize() {
        // Correctly initialize Filament and provide asset URLs
        const assetPath = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
        await Filament.init([`${assetPath}/filament-wasm.wasm`, `${assetPath}/ibl.ktx`]);

        this.engine = Engine.create(this.canvas);
        this.scene = this.engine.createScene();
        this.swapChain = this.engine.createSwapChain();
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
        this.unlitMaterial = this.engine.createMaterial(materialBlob);

        this.playerTexture = await this.loadTexture('wazzy_spritesheet.png');
        this.platformTexture = await this.loadTexture('platform.png');

        this.playerMaterialInstance = this.unlitMaterial.createInstance();
        this.platformMaterialInstance = this.unlitMaterial.createInstance();

        // Use Filament's enums for the sampler
        const sampler = new TextureSampler(Filament.MinFilter.NEAREST, Filament.MagFilter.NEAREST, Filament.WrapMode.CLAMP_TO_EDGE);
        
        // Use the correct setTextureParameter method
        this.playerMaterialInstance.setTextureParameter('baseColorMap', this.playerTexture, sampler);
        this.platformMaterialInstance.setTextureParameter('baseColorMap', this.platformTexture, sampler);
    }

    private async loadTexture(url: string): Promise<Texture> {
        const response = await fetch(url);
        const image = await createImageBitmap(await response.blob());
        // Use the texture builder for creation
        const texture = new Texture.Builder()
            .width(image.width)
            .height(image.height)
            .levels(1)
            .usage(Texture.Usage.COLOR_ATTACHMENT)
            .format(Texture.InternalFormat.RGBA8)
            .build(this.engine);
        texture.setImage(this.engine, 0, image);
        return texture;
    }
    
    private createQuadGeometry() {
        const POS_UV = new Float32Array([
            -0.5, -0.5, 0.0, 0.0, 1.0,
             0.5, -0.5, 0.0, 1.0, 1.0,
            -0.5,  0.5, 0.0, 0.0, 0.0,
             0.5,  0.5, 0.0, 1.0, 0.0,
        ]);

        const INDICES = new Uint16Array([0, 1, 2, 2, 1, 3]);

        // Use the correct builder pattern from Filament
        const vb = new Filament.VertexBuffer.Builder()
            .vertexCount(4)
            .bufferCount(1)
            .attribute(Filament.VertexAttribute.POSITION, 0, Filament.VertexBuffer$AttributeType.FLOAT3, 0, 20)
            .attribute(Filament.VertexAttribute.UV0, 0, Filament.VertexBuffer$AttributeType.FLOAT2, 12, 20)
            .build(this.engine);
        vb.setBufferAt(this.engine, 0, POS_UV);
        this.quadVertexBuffer = vb;

        const ib = new Filament.IndexBuffer.Builder()
            .indexCount(6)
            .bufferType(Filament.IndexBuffer$IndexType.USHORT)
            .build(this.engine);
        ib.setBuffer(this.engine, INDICES);
        this.quadIndexBuffer = ib;
    }

    public draw(renderData: RenderData, renderer: Filament.Renderer) {
        // Clear previous entities
        for (const entity of this.entities) {
            this.scene.remove(entity);
            Engine.destroy(entity); // Use static destroy method
        }
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
            // We don't need UVs from WASM for this simple case, but we advance the offset
            offset += 36;
            
            let materialInstance = type === RENDER_TYPE_PLAYER ? this.playerMaterialInstance : this.platformMaterialInstance;
            if (!materialInstance) continue;

            const entity = EntityManager.get().create();
            this.entities.push(entity);
            
            new RenderableManager.Builder(1)
                .boundingBox({ center: [0, 0, 0], halfExtent: [0.5, 0.5, 0.02] })
                .material(0, materialInstance)
                .geometry(0, Filament.RenderableManager$PrimitiveType.TRIANGLES, this.quadVertexBuffer!, this.quadIndexBuffer!)
                .build(this.engine, entity);

            this.scene.addEntity(entity);

            const tcm = this.engine.getTransformManager();
            const inst = tcm.getInstance(entity);
            // setTransform now expects a 16-element matrix (mat4)
            const transform = mat4.create();
            mat4.translate(transform, transform, [x, y, 0]);
            mat4.scale(transform, transform, [w, h, 1]);
            tcm.setTransform(inst, transform as unknown as number[]);
        }

        renderer.render(this.swapChain, this.view);
    }

    public resize() {
        const dpr = window.devicePixelRatio;
        const width = this.canvas.width = this.canvas.clientWidth * dpr;
        const height = this.canvas.height = this.canvas.clientHeight * dpr;
        this.view.setViewport([0, 0, width, height]);

        const aspect = width / height;
        const V_HEIGHT = 10;
        const V_WIDTH = V_HEIGHT * aspect;
        
        // Use the correct enum for projection type
        this.camera.setProjection(Filament.Camera$Projection.ORTHO, -V_WIDTH/2, V_WIDTH/2, -V_HEIGHT/2, V_HEIGHT/2, 0, 10);
    }

    public getEngine(): Engine {
        return this.engine;
    }
}

// To fix the transform error, you need a matrix library.
// gl-matrix is a standard choice. Run `npm install gl-matrix`
// and then import it at the top of the file.
import { mat4 } from 'gl-matrix';
