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

// This imports the factory function from the emscripten-generated main.js
// The '?url' suffix is a Vite feature that gives us the URL to the asset
import createWasmModule from '/main.js?url';

// Default export of the loader function
export default async function loadGameModule(): Promise<GameModule> {
  const module = await (window as any).createWasmModule({
    canvas: (() => {
      const canvas = document.createElement('canvas');
      document.body.appendChild(canvas);
      return canvas;
    })(),
  });
  return module;
}
