export interface Position {
  x: number;
  y: number;
}

// FIX: Add the definition for the InputState struct
export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
}

// FIX: Add the new handleInput method to the Game interface
export interface Game {
  update(deltaTime: number): void;
  handleInput(inputState: InputState): void;
  getPlayerPosition(): Position;
  delete(): void;
}

export interface GameModule {
  Game: { new(): Game };
}

// This loader function finds the WASM module on the global window object.
// This is the most reliable method and avoids module resolution errors.
export const loadWasmModule = async (): Promise<GameModule> => {
  const factory = (window as any).createGameModule;
  if (!factory) {
    throw new Error("WASM module factory not found on window. Did game.js load correctly from the script tag in index.html?");
  }
  const module = await factory();
  return module as GameModule;
};
