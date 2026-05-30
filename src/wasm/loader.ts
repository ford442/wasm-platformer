export interface Vec2 { x: number; y: number; }

export interface Platform { position: Vec2; size: Vec2; }

export interface PlatformList { get(index: number): Platform; size(): number; }

export interface InputState { left: boolean; right: boolean; jump: boolean; abilityKey: boolean; }

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
  loadLevel(level: any): void;
  setLevelCompleteCallback(callback: () => void): void;
  // Two-character (Bolts / Volts) system
  switchCharacter(): void;
  getCurrentCharacter(): number; // 0 = Bolts, 1 = Volts
  useAbility(): void;
  getAbilityState(): number;    // 0 = Ready, 1 = Active, 2 = Cooldown
  getAbilityCooldownPercent(): number; // 0.0 to 1.0
  delete(): void;
}

export interface GameModule {
  Game: { new(): Game };
}

export const loadWasmModule = async (): Promise<GameModule> => {
  // Modern Emscripten path (build:wasm uses -s EXPORT_NAME="createWasmModule" + MODULARIZE + EXPORT_ES6).
  // The generated src/wasm/main.js exports the factory as its default.
  // We use dynamic import so the large glue + WASM fetch happens on demand and Vite can handle the .wasm sibling asset.
  try {
    const mod = await import('../wasm/main.js');
    const factory = mod.default || (window as any).createWasmModule || (window as any).createGameModule;
    if (typeof factory === 'function') {
      return await factory() as GameModule;
    }
  } catch (e) {
    console.warn('[WASM] Direct import of ../wasm/main.js failed, trying legacy window fallbacks:', e);
  }

  // Legacy fallbacks (pre-2025 builds or manual script tags)
  if ((window as any).createWasmModule) {
    return await (window as any).createWasmModule() as GameModule;
  }
  if ((window as any).createGameModule) {
    return await (window as any).createGameModule() as GameModule;
  }

  // Last resort: try injecting a script named game.js (old behavior)
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'game.js';
    script.onload = async () => {
      const factory = (window as any).createWasmModule || (window as any).createGameModule;
      if (factory) {
        resolve(await factory() as GameModule);
      } else {
        reject(new Error("game.js loaded but no WASM factory found on window"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load game.js (legacy fallback)"));
    document.body.appendChild(script);
  });
};
