export interface Vec2 { x: number; y: number; }

export interface Platform { position: Vec2; size: Vec2; }

export interface PlatformList { get(index: number): Platform; size(): number; }

export interface InputState { left: boolean; right: boolean; jump: boolean; }

export interface AnimationState {
  currentState: string;
  currentFrame: number;
  facingLeft: boolean;
}

export interface Particle {
  position: Vec2;
  velocity: Vec2;
  life: number;
  maxLife: number;
  size: number;
  rotation: number;
  angularVelocity: number;
}

export interface ParticleList { get(index: number): Particle; size(): number; }

export interface Game {
  update(deltaTime: number): void;
  handleInput(inputState: InputState): void;
  getPlayerPosition(): Vec2;
  getPlayerSize(): Vec2;
  getCameraPosition(): Vec2;
  getPlatforms(): PlatformList;
  getParticles(): ParticleList;
  getPlayerAnimationState(): AnimationState;
  setSoundCallback(callback: (soundName: string) => void): void;
  loadLevel(level: any): void; // accepts a plain JS object parsed from JSON
  setLevelCompleteCallback(callback: () => void): void;
  delete(): void;
}

export interface GameModule {
  Game: { new(): Game };
}

export const loadWasmModule = async (): Promise<GameModule> => {
  if ((window as any).createGameModule) {
    return await (window as any).createGameModule() as GameModule;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'game.js';
    script.onload = async () => {
      const factory = (window as any).createGameModule;
      if (factory) {
        resolve(await factory() as GameModule);
      } else {
        reject(new Error("game.js loaded but createGameModule not found on window"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load game.js"));
    document.body.appendChild(script);
  });
};
