# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WASM-Venture (package name: `wasm-platformer`) is a browser-based 2D platformer. The character Wazzy (a dog robot) is controlled via arrow keys and Space. Game logic runs in C++ compiled to WebAssembly via Emscripten; TypeScript/React bridges the WASM module to a WebGL2 canvas renderer.

## Build & Dev Commands

```bash
# Install dependencies
npm install

# Run dev server (also compiles WASM first)
npm run dev

# Build WASM only
npm run build:wasm

# Full production build
npm run build

# Lint
npm run lint

# Preview production build
npm run preview
```

**Prerequisite:** Emscripten (`emcc`) must be on `PATH` for any command that compiles WASM. The `build:wasm` script outputs `src/wasm/main.js` + `main.wasm`.

## Architecture

### Data flow
```
C++ (Game logic) → Emscripten → src/wasm/main.js + main.wasm
                                      ↓
                            src/wasm/loader.ts   (TypeScript interface + module loader)
                                      ↓
                      src/components/GameCanvas.tsx  (React component, game loop)
                           ↙                  ↘
              src/gl/renderer.ts          src/audio/AudioManager.ts
              (WebGL2 rendering)          (Web Audio API)
```

### C++ side (`cpp/src/`)
- `Game.cpp / Game.hpp` — all game state: player physics, collision, camera, particle system, sound callbacks, level loading. Exposed to JS via Emscripten `embind`.
- `ParticleSystem.hpp` — particle emission/update logic.
- `Types.hpp` — shared structs (`Vec2`, `Platform`, `InputState`, `AnimationState`, `PlayerState`).
- The WASM module is exported as an ES6 factory called `createWasmModule` (not the older `createGameModule`).

### TypeScript/React side (`src/`)
- `wasm/loader.ts` — TypeScript interfaces mirroring the C++ embind exports; `loadWasmModule()` either uses an already-loaded global or injects `game.js` via a `<script>` tag.
- `gl/renderer.ts` — `Renderer` class: compiles GLSL shaders, manages two WebGL programs (sprite and background), loads textures, computes per-frame foot anchors from spritesheet pixel data, draws scene each frame.
- `gl/shaders/` — two shader pairs: `tex.vert/frag.glsl` (sprite/platform rendering with spritesheet UV math) and `background.vert/frag.glsl` (parallax scrolling background quad).
- `audio/AudioManager.ts` — wraps Web Audio API; music starts on first keypress (browser autoplay policy); SFX names (`jump`, `land`) are fired by a JS callback registered with `Game::setSoundCallback`.
- `components/GameCanvas.tsx` — mounts the canvas, owns the `requestAnimationFrame` loop, wires input/output between WASM and renderer, manages volume state and level-complete overlay.
- `components/App.tsx` / `src/App.tsx` — top-level React shell (minimal).

### Level format (`public/levels/*.json`)
```json
{
  "spawn": { "x": 0.0, "y": -1.0 },
  "bounds": { "min": { "x": -10.0, "y": -10.0 }, "max": { "x": 20.0, "y": 10.0 } },
  "platforms": [ { "position": { "x": 5.0, "y": -2.0 }, "size": { "x": 110.0, "y": 0.2 } } ],
  "goals":     [ { "position": { "x": 16.0, "y": 2.0 }, "size": { "x": 1.0, "y": 1.0 } } ]
}
```
Levels are fetched at runtime from `/levels/<name>.json` and passed as a plain JS object to `Game::loadLevel` via embind.

### Coordinate system
World units are used throughout (not pixels). The viewport shows 10 world-units wide, aspect-ratio-corrected. Positive Y is up. Player collision and camera positions come from WASM; the renderer applies a per-frame foot-anchor offset computed from spritesheet alpha to align sprites with collision boxes.

### Assets (`public/`)
- `wazzy_spritesheet.png` — 64×64 px frames, rows: 0=idle (2 frames), 1=run (4 frames), 2=jump (1 frame).
- `platform.png`, `background.png` — textures tiled/scrolled by the two shader programs.
- `background-music.mp3`, `jump.mp3`, `land.mp3` — audio assets loaded at init.
