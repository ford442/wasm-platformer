# WASM-Venture — Agent Guide

> This file is written for AI coding agents. The reader is assumed to know nothing about the project.

## Project Overview

**WASM-Venture** is a 2D browser platformer. The player controls Wazzy, a small dog robot, navigating levels to collect ship parts and return home.

- **Core logic:** C++ (physics, collision, animation state machine, particle system)
- **Compilation target:** WebAssembly via Emscripten (`emcc`)
- **Frontend / bridge:** TypeScript + React 19
- **Rendering:** WebGL2 on an HTML Canvas element
- **Build tool:** Vite

## Technology Stack

| Layer | Tech |
|-------|------|
| Game engine | C++17-ish (no external C++ deps) |
| WASM toolchain | Emscripten (`emcc`) with **embind** |
| Frontend framework | React 19 (functional components + hooks) |
| Language | TypeScript 5.8 (strict mode) |
| Bundler / dev server | Vite 7 |
| Renderer | Raw WebGL2 (GLSL ES 3.0) |
| Audio | Web Audio API (`AudioContext`) |
| Deployment | Python 3 + Paramiko (SFTP upload) |

## Project Structure

```
├── cpp/src/                    # C++ game engine
│   ├── main.cpp                # Embind bindings (JS ↔ C++ bridge)
│   ├── Game.cpp / Game.hpp     # Main game class: physics, collision, state machine
│   ├── Types.hpp               # Shared structs: Vec2, Platform, InputState, AnimationState
│   └── ParticleSystem.hpp      # Simple particle emitter/update loop
├── src/                        # TypeScript / React source
│   ├── main.tsx                # React root mount
│   ├── components/
│   │   ├── App.tsx             # Top-level layout (header, canvas, footer)
│   │   └── GameCanvas.tsx      # Game loop, input handling, WASM init, renderer setup
│   ├── gl/
│   │   ├── renderer.ts         # WebGL2 renderer: sprite drawing, background, textures
│   │   └── shaders/            # GLSL ES 3.0 shaders
│   │       ├── tex.vert.glsl / tex.frag.glsl         # Sprite / spritesheet shader
│   │       ├── background.vert.glsl / background.frag.glsl  # Parallax background shader
│   │       └── basic.vert.glsl / basic.frag.glsl     # Unused solid-color shader
│   ├── wasm/
│   │   └── loader.ts           # TypeScript interfaces + WASM module loader
│   └── audio/
│       └── AudioManager.ts     # Web Audio API wrapper (music + SFX)
├── public/                     # Static assets served by Vite
│   ├── levels/test-1.json      # Level definition (spawn, platforms, goals, bounds)
│   ├── shaders/                # Legacy copy of GLSL shaders (unused by Vite build)
│   ├── wazzy_spritesheet.png   # Player sprite sheet (64×64 frames)
│   ├── platform.png            # Platform texture
│   ├── background.png          # Parallax background texture
│   ├── wazzy.png               # Standalone player sprite (unused)
│   ├── background-music.mp3    # BGM
│   ├── jump.mp3 / land.mp3     # SFX
│   └── ...
├── index.html                  # Entry HTML (no inline WASM script; loaded dynamically)
├── package.json                # npm scripts & deps
├── vite.config.ts              # Vite config (base: './', React plugin)
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json  # TypeScript configs
├── custom.d.ts                 # Global Window.createGameModule augmentation
└── deploy.py                   # SFTP deployment script
```

## Build & Run Commands

All commands run from the repository root.

**Prerequisites:**
- Node.js + npm
- Emscripten SDK (`emcc` must be on `PATH`)

**Development:**
```bash
npm install
npm run dev           # build:wasm + vite dev server
```

**Production build:**
```bash
npm run build         # build:wasm + tsc + vite build → dist/
```

**WASM-only build:**
```bash
npm run build:wasm    # emcc compiles cpp/src/*.cpp → src/wasm/main.js
```

**Lint:**
```bash
npm run lint          # eslint . --ext ts,tsx
```

**Preview production build:**
```bash
npm run preview       # vite preview
```

## Architecture Details

### C++ ↔ JS Bridge (embind)

`cpp/src/main.cpp` uses `EMSCRIPTEN_BINDINGS` to expose:
- Value objects: `Vec2`, `Platform`, `InputState`, `AnimationState`, `Particle`
- Vectors: `PlatformList`, `ParticleList`
- Class: `Game` with methods `update`, `handleInput`, `getPlayerPosition`, `getCameraPosition`, `getPlatforms`, `getParticles`, `getPlayerAnimationState`, `getPlayerSize`, `setSoundCallback`, `loadLevel`, `setLevelCompleteCallback`

The Emscripten build produces an ES module (`src/wasm/main.js`) with `EXPORT_ES6=1` and `MODULARIZE=1`. The exported factory is named `createWasmModule` in the build script, but `custom.d.ts` and `src/wasm/loader.ts` also refer to `createGameModule` (legacy name from earlier builds). The loader checks both names and falls back to loading `game.js` dynamically if neither exists.

### Game Loop

`GameCanvas.tsx` owns the loop:
1. `requestAnimationFrame` drives `gameLoop(timestamp)`.
2. Each frame:
   - Reads `keysRef` (ArrowLeft, ArrowRight, Space).
   - Calls `gameInstance.handleInput(inputState)`.
   - Calls `gameInstance.update(deltaTime)`.
   - Pulls platform & particle data out of WASM vectors into JS arrays.
   - Calls `renderer.drawScene(...)`.

### Rendering

`src/gl/renderer.ts` is a hand-written WebGL2 renderer:
- **Sprite program:** draws textured quads with sprite-sheet animation support (`u_sprite_frame_coord`, `u_flip_horizontal`).
- **Background program:** full-screen quad with parallax scrolling based on camera position.
- **Debug overlays:** semi-transparent red (player) and green (platform) collision boxes drawn on top.
- **Texture anchors:** when loading the player spritesheet, the renderer inspects alpha pixels to compute per-frame bottom offsets so the sprite’s feet align with the collision box.

### Level Format

Levels are JSON files like `public/levels/test-1.json`:
```json
{
  "spawn": { "x": 0.0, "y": -1.0 },
  "bounds": { "min": { "x": -10.0, "y": -10.0 }, "max": { "x": 20.0, "y": 10.0 } },
  "platforms": [
    { "position": { "x": 0.0, "y": -0.8 }, "size": { "x": 2.0, "y": 0.2 } }
  ],
  "goals": [
    { "position": { "x": 16.0, "y": 2.0 }, "size": { "x": 1.0, "y": 1.0 } }
  ]
}
```

`Game::loadLevel(emscripten::val level)` parses this at runtime (clearing the hard-coded fallback platforms).

### Audio

`AudioManager` uses the Web Audio API:
- Loads SFX and music via `fetch` → `decodeAudioData`.
- Plays SFX through a shared `GainNode`.
- Loops music via `AudioBufferSourceNode`.
- Volume slider in `GameCanvas` adjusts the `GainNode` gain.
- The audio context is resumed on first keydown (browser autoplay policy).

Sound events are triggered from C++ via `setSoundCallback` → JS callback. Supported names: `"jump"`, `"land"`.

## Code Style Guidelines

- **TypeScript:** Strict mode enabled (`strict`, `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`).
- **React:** Functional components only; hooks for state and effects.
- **Styling:** Inline `React.CSSProperties` objects inside components. No CSS-in-JS library. Global theme variables live in `src/index.css` (`:root` CSS custom properties).
- **Imports:** ES modules (`"type": "module"` in `package.json`). Use `?raw` suffix for GLSL imports in Vite.
- **C++:** Header guards (`#ifndef … #define … #endif`). No namespaces used. `std::vector` for lists. `emscripten::val` for JS callbacks.

## Known Issues & Quirks

1. **`cpp/src/Game.cpp` has a stray block after the constructor.** Lines 95–107 contain `platforms.push_back` calls outside any function body (after the closing `}` of the constructor). This will cause a C++ compilation error and must be fixed or removed before `npm run build:wasm` succeeds.
2. **Duplicate `App.tsx`.** Both `src/App.tsx` and `src/components/App.tsx` exist. `src/main.tsx` imports from `./components/App`, so `src/App.tsx` is dead code.
3. **Legacy global WASM loader.** `custom.d.ts` and `loader.ts` still reference `window.createGameModule` and a dynamic `game.js` script injection. The current Vite build imports the module directly, so the fallback path is rarely used.
4. **Hardcoded credentials in `deploy.py`.** The SFTP password is stored in plaintext. This is a security risk.
5. **No automated tests.** There is no test runner, test directory, or CI configuration.

## Deployment

`deploy.py` recursively uploads the `dist/` directory via SFTP to `go.1ink.us/platformer`.

Usage:
```bash
npm run build
python deploy.py
```

> Do not commit `deploy.py` changes that include credentials.

## Security Considerations

- `deploy.py` contains a hardcoded SFTP password. Rotate it if the repository is ever shared.
- The game runs entirely client-side; there is no server-side auth or data persistence.
- `eslint` is configured but does not run automatically on build.
