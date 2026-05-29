# Copilot Instructions for WASM-Venture

This document provides essential context for AI assistants working on the WASM-Venture codebase.

## Build, Test & Lint Commands

**Build & Development:**
- `npm run dev` — Compile C++ to WebAssembly and start Vite dev server
- `npm run build:wasm` — Compile C++ to WebAssembly only (outputs to `src/wasm/main.js`)
- `npm run build` — Full production build (WASM + TypeScript compilation + Vite bundling)
- `npm run lint` — Run ESLint on all `.ts` and `.tsx` files; fails on warnings

**Prerequisites:** Emscripten SDK must be installed and `emsdk` environment variables configured.

## High-Level Architecture

WASM-Venture is a 2D platformer combining C++ game logic with a React/WebGL2 frontend.

### Core Components

1. **Game Logic (C++/WASM)**
   - Location: `cpp/src/` (Game.cpp, ParticleSystem.hpp, etc.)
   - Compiled via Emscripten to `src/wasm/main.js`
   - Exported functions: `update()`, `handleInput()`, `getPlayerPosition()`, `getPlatforms()`, `getParticles()`, `getPlayerAnimationState()`
   - Uses callbacks (`setSoundCallback`, `setLevelCompleteCallback`) for JavaScript interop

2. **TypeScript/React Frontend** (`src/`)
   - **Components:**
     - `App.tsx` — Main layout with header, game canvas, footer
     - `GameCanvas.tsx` — Canvas container; manages WASM instance, event listeners, game loop, and renderer
   - **WebGL Rendering** (`gl/renderer.ts`)
     - Sprite rendering with texture atlases and animation frame tracking
     - Background parallax rendering
     - Handles shader compilation, uniforms, buffer management
   - **WASM Loader** (`wasm/loader.ts`)
     - Type definitions for WASM exports (Vec2, Platform, InputState, AnimationState, Particle, Game interface)
     - Dynamic module loading via `createGameModule()`
   - **Audio** (`audio/AudioManager.ts`)
     - Web Audio API wrapper for SFX playback and looped music

3. **Assets & Levels**
   - Sprites: `public/wazzy_spritesheet.png`, `public/platform.png`, `public/background.png`
   - Audio: `public/background-music.mp3`, `public/jump.mp3`, `public/land.mp3`
   - Levels: `public/levels/test-1.json` (loaded and parsed by WASM)

### Data Flow

1. React renders `GameCanvas` with a canvas element
2. On mount, `GameCanvas` loads WASM module and textures in parallel
3. Game loop (via `requestAnimationFrame`):
   - Poll input from `keysRef` (ArrowLeft, ArrowRight, Space)
   - Call `gameInstance.handleInput()` with InputState
   - Call `gameInstance.update(deltaTime)` to advance physics/animation
   - Retrieve player position, platforms, particles, and animation state from WASM
   - Render via `Renderer.drawScene()`
4. WASM calls back to JavaScript via `setSoundCallback` for audio events

### WASM-JavaScript Binding

TypeScript interfaces in `src/wasm/loader.ts` mirror Emscripten bindings in `cpp/src/main.cpp`. When modifying WASM exports:
- Update `cpp/src/main.cpp` with new Emscripten binding entries
- Mirror changes in TypeScript interfaces (`src/wasm/loader.ts`)
- Rebuild WASM: `npm run build:wasm`

## Key Conventions

### React Patterns

- **Avoid useState for high-frequency updates:** The game loop runs 60 times per second. For values used every frame (player position, platforms), retrieve them directly from WASM in the game loop rather than storing in React state. Only use useState for UI state (volume, level completion).
- **Refs for performance-critical data:** `keysRef` holds current input state; `canvasRef` accesses the DOM; `gameInstanceRef` maintains the WASM instance across renders without triggering re-renders.
- **Async initialization:** WASM module and textures are loaded with `Promise.all()` before the game loop starts.

### WebGL Rendering

- **Shader uniforms:** Use `Renderer` class methods to set matrices, positions, and sampler uniforms. Shader source is imported as raw strings with `?raw` Vite query parameter.
- **Texture atlases:** `animationMap` in `renderer.ts` defines sprite regions (row, frame count, frame size). Per-texture anchors can be stored to fine-tune sprite positioning.
- **Buffer management:** Vertex/UV buffers are created once and reused; uniforms are updated each frame.

### C++ / Emscripten

- **Value objects:** Use Emscripten's `emscripten::value_object` for simple POD structs (Vec2, Platform, InputState, AnimationState, Particle).
- **Vectors:** Use `emscripten::register_vector` to expose `std::vector` to JavaScript with `.get(index)` and `.size()` methods.
- **Callbacks:** Store callbacks as `emscripten::val` and invoke with `.call<void>("soundCallback", sound_name)` or similar.
- **JSON interop:** Use `emscripten::val` for plain JavaScript objects (e.g., level JSON passed from React).

### TypeScript & Linting

- **Strict mode:** `tsconfig.json` has `"strict": true`; no implicit `any` types.
- **ESLint enforces zero warnings:** The lint script fails if any warnings are reported. Clean up all warnings before committing.
- **React 19 compatibility:** Use `React.StrictMode` for development warnings; compatible with latest React Refresh plugin.

### File Organization

- **Type definitions:** Interfaces for WASM exports are in `src/wasm/loader.ts`, not duplicated elsewhere.
- **Shaders:** GLSL files in `src/gl/shaders/` imported as raw strings.
- **Public assets:** All static files (sprites, audio, levels) in `public/` served at root URL during dev and build.

## Development Workflow

1. **For game logic changes:** Edit `cpp/src/*.cpp/*.hpp`, run `npm run build:wasm`, then reload the browser.
2. **For rendering changes:** Edit `src/gl/renderer.ts` or shaders, Vite will hot-reload automatically.
3. **For React/UI changes:** Edit `src/components/`, Vite handles hot-module replacement.
4. **Before committing:** Run `npm run lint` and fix any warnings; run `npm run build` to verify production build succeeds.

## Relevant Notes

- **Canvas size:** Fixed at 1280×720 with 16:9 aspect ratio; `maxWidth` constraint in App.tsx for responsive layout.
- **Camera system:** Follows player horizontally; camera position is set per-frame from WASM.
- **Particle system:** Managed in WASM (physics, rotation, lifetime); rendered in JavaScript as simple quads.
- **Audio context:** Resumed on first user interaction (key press) to comply with browser autoplay policies.
