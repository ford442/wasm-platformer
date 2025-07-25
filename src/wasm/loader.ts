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
  return new Promise((resolve, reject) => {
    // Create a script element to load the game's JavaScript file
    const script = document.createElement('script');
    script.src = 'https://test.1ink.us/platformer/game.js';
    script.async = true;

    // Define a function to be called once the script is loaded
    script.onload = async () => {
      // The script is expected to attach a factory function to the window
      const factory = (window as any).createWasmVentureModule;
      if (typeof factory !== 'function') {
        return reject(new Error("WASM module factory ('createWasmVentureModule') not found on window."));
      }

      try {
        // Call the factory to get the module instance
        const module = await factory();
        resolve(module as GameModule);
      } catch (error) {
        reject(error);
      }
    };

    // Handle script loading errors
    script.onerror = () => {
      reject(new Error("Failed to load WASM module script from: " + script.src));
    };

    // Append the script to the document's head to trigger loading
    document.head.appendChild(script);
  });
};
