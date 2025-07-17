/// <reference types="vite/client" />

// This declares a module for our Emscripten glue code.
// It tells TypeScript that whenever we import '/game.js',
// it should expect a default export that is a function returning a Promise.
declare module '/game.js' {
  const createGameModule: () => Promise<any>;
  export default createGameModule;
}
