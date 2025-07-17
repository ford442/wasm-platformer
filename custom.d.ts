// custom.d.ts
// This file provides custom type declarations for the project.

// This reference is for Vite-specific features, like importing assets with '?raw'
/// <reference types="vite/client" />

// This declares a module for our Emscripten glue code.
// It tells TypeScript that whenever we import '/game.js',
// it should expect a default export that is a function returning a Promise.
declare module './src/wasm/game.js' {
  const createGameModule: () => Promise<{
    Game: new () => {
      update(deltaTime: number): void;
      getPlayerPosition(): { x: number; y: number };
      delete(): void;
    };
  }>;
  export default createGameModule;
}

