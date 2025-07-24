export interface Vec2 { x: number; y: number; }
export interface Platform { position: Vec2; size: Vec2; }
export interface PlatformList { get(index: number): Platform; size(): number; }
export interface InputState { left: boolean; right: boolean; jump: boolean; }
export interface AnimationState {
  currentState: string;
  currentFrame: number;
  facingLeft: boolean;
}

// This is the interface that TypeScript uses to understand our C++ Game class.
export interface Game {
  update(deltaTime: number): void;
  handleInput(inputState: InputState): void;
  getPlayerPosition(): Vec2;
  getPlayerSize(): Vec2;
  getCameraPosition(): Vec2;
  getPlatforms(): PlatformList;
  getPlayerAnimationState(): AnimationState;
  
  // New: Add the function signature for our sound callback setter.
  // It takes a function that accepts a string and returns nothing.
  setSoundCallback(callback: (soundName: string) => void): void;
  
  delete(): void;
}

export interface GameModule { 
  Game: { new(): Game }; 
}

// This function loads the Emscripten-generated WASM module.
export const loadWasmModule = async (): Promise<GameModule> => {
  // The 'createGameModule' function is attached to the window object by the game.js script.
  const factory = (window as any).createGameModule;
  if (!factory) {
    throw new Error("WASM module factory not found on window. Did you include game.js in your index.html?");
  }
  return await factory() as GameModule;
};
