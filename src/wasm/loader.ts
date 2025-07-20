export interface Vec2 { x: number; y: number; }
export interface Platform { position: Vec2; size: Vec2; }
export interface PlatformList { get(index: number): Platform; size(): number; }
export interface InputState { left: boolean; right: boolean; jump: boolean; }

// NEW: Interface for the C++ AnimationState struct
export interface AnimationState {
  currentState: string;
  currentFrame: number;
  facingLeft: boolean;
}

export interface Game {
  update(deltaTime: number): void;
  handleInput(inputState: InputState): void;
  getPlayerPosition(): Vec2;
  getCameraPosition(): Vec2;
  getPlatforms(): PlatformList;
  getPlayerAnimationState(): AnimationState; // NEW
  delete(): void;
}

export interface GameModule { Game: { new(): Game }; }

export const loadWasmModule = async (): Promise<GameModule> => {
  const factory = (window as any).createGameModule;
  if (!factory) throw new Error("WASM module factory not found on window.");
  return await factory() as GameModule;
};
