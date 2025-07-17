export interface Position {
  x: number;
  y: number;
}

// Represents the C++ Game class instance
export interface Game {
  update(deltaTime: number): void;
  getPlayerPosition(): Position;
  // This is important for memory management
  delete(): void;
}

// Represents the factory that creates the Game instance
export interface GameModule {
  Game: { new(): Game };
}

export const loadWasmModule = async (): Promise<GameModule> => {
  const factory = (window as any).createGameModule;
  if (!factory) {
    throw new Error("WASM module factory not found. Did you include game.js in your public folder and recompile?");
  }
  const module = await factory();
  return module as GameModule;
};
