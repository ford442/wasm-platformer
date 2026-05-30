
/// <reference types="vite/client" />

interface Window {
  createWasmModule?: () => Promise<any>;
  createGameModule?: () => Promise<any>;
}
