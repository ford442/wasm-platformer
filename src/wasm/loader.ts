// Import the factory function directly from the generated JS file.
// The '/game.js' path assumes game.js is in the public folder.
// Vite will handle resolving this path correctly during the build.
import createGameModule from '/content/RAMDRIVE2/wasm-platformer/dist/game.js';

// Represents the C++ Position struct
export interface Position {
  x: number;
  y: number;
}

// Represents the C++ Game class instance
export interface Game {
  update(deltaTime: number): void;
  getPlayerPosition(): Position;
  delete(): void; // Important for memory management
}

// Represents the factory that creates the Game instance
export interface GameModule {
  Game: { new(): Game };
}

export const loadWasmModule = async (): Promise<GameModule> => {
  // Look for the function on the window object
  const factory = (window as any).createGameModule;
  if (!factory) {
    throw new Error("WASM module factory not found on window. Did game.js load correctly from the script tag in index.html?");
  }
  const module = await factory();
  return module as GameModule;
};
