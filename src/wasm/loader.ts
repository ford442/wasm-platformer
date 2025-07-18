export interface Vec2 { x: number; y: number; }

export interface Platform {
  position: Vec2;
  size: Vec2;
}

// This is a special type from Emscripten for a std::vector
export interface PlatformList {
  get(index: number): Platform;
  size(): number;
}

export interface InputState { left: boolean; right: boolean; jump: boolean; }

export interface Game {
  update(deltaTime: number): void;
  handleInput(inputState: InputState): void;
  getPlayerPosition(): Vec2;
  getPlatforms(): PlatformList; // The C++ vector is exposed as this type
  delete(): void;
}

export interface GameModule {
  Game: { new(): Game };
}

export const loadWasmModule = async (): Promise<GameModule> => {
  const factory = (window as any).createGameModule;
  if (!factory) throw new Error("WASM module factory not found on window.");
  return await factory() as GameModule;
};
