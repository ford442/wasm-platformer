import createWasmModule from './main.js';

// Define the shape of the C++ Game class exposed via Emscripten
interface Game {
  new(): Game; // Constructor
  update(left: boolean, right: boolean, jump: boolean): void;
  getRenderData(): any;
  getBackgroundData(): any;
  getSoundData(): any;
  delete(): void;
}

// Define the shape of the fully loaded WASM module instance
export interface GameModule {
  instance: {
    Game: Game;
    HEAPF32: {
      buffer: ArrayBuffer;
    };
  };
}

// Default export of the loader function
export default async function loadGameModule(): Promise<GameModule> {
  // Since we now have a proper ES6 module, we can call it directly.
  const module = await createWasmModule();
  return module as unknown as GameModule;
}
