// Import the factory function directly from the generated JS file.
// The '/game.js' path assumes game.js is in the public folder.
// Vite will handle resolving this path correctly during the build.
import createGameModule from 'src/wasm/game.js';';

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
  // The imported 'createGameModule' is the factory function itself.
  if (!createGameModule) {
    throw new Error("WASM module factory could not be imported. Check the path and that game.js is an ES6 module.");
  }
  
  // Calling the factory function initializes the module and returns a promise
  // that resolves with the module instance.
  const module = await createGameModule();
  
  return module as GameModule;
};
