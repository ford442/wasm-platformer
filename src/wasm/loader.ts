// This interface defines the structure of our WASM module once it's loaded.
// It helps TypeScript understand what functions are available.
export interface GameModule {
  getPlayerStartX: () => number;
  // We will add more functions here as we create them in C++.
}

// This function loads the Emscripten-generated 'game.js' glue code
// and initializes the WebAssembly module.
export const loadWasmModule = async (): Promise<GameModule> => {
  // The 'createGameModule' function is the global export from game.js,
  // which we defined with the EXPORT_NAME build flag.
  // We need to tell TypeScript that this function might exist on the window object.
  const factory = (window as any).createGameModule;

  if (!factory) {
    throw new Error("WASM module factory not found. Did you include game.js?");
  }

  // Calling the factory function initializes the module and returns a promise
  // that resolves with the module instance.
  const module = await factory();
  
  return module as GameModule;
};
