# grok.md — Grok AI Assistant Guide for Bolts and Volts

> Read this first. Complements the detailed [CLAUDE.md](./CLAUDE.md) (architecture deep-dive) and [README.md](./README.md).

## Documentation Map

- Docs hub: [`docs/README.md`](./docs/README.md)
- AI index: [`docs/ai/README.md`](./docs/ai/README.md)
- AGENTS guide: [`AGENTS.md`](./AGENTS.md)
- Claude guide: [`CLAUDE.md`](./CLAUDE.md)
- Copilot guide: [`.github/copilot-instructions.md`](./.github/copilot-instructions.md)
- Roadmap plan: [`docs/plans/PLAN.md`](./docs/plans/PLAN.md)
- Changelog: [`CHANGELOG.md`](./CHANGELOG.md)

## Project Overview

**Bolts & Volts** (legacy codename: WASM-Venture) is a browser-based 2D platformer. The player controls **Wazzy**, a small agile dog robot that crash-landed on an alien planet. The goal is to traverse hand-crafted levels full of platforms, collect ship parts (modeled as "goals"), and escape.

## Branding

- Public project name: **Bolts & Volts**
- npm package name: **`bolts-and-volts`**
- Legacy codename references (`WASM-Venture`, `wasm-platformer`) are historical only.

- **Core Loop**: Precise platforming, momentum, jumping, landing/jump feedback.
- **Tech Split**: All gameplay physics, collision, animation state, particles, and level loading live in **C++** compiled to WebAssembly via Emscripten + embind. The TypeScript/React layer owns rendering (WebGL2), input, audio, and orchestration.

## Technology Stack

- **Game Logic**: C++ (Emscripten embind, no stdlib heavy usage)
- **Build**: Emscripten (`emcc`) + Vite 7 + TypeScript + React 19
- **Rendering**: WebGL2 (custom shaders: sprite sheet animation + parallax scrolling background quad)
- **Audio**: Web Audio API (music + SFX triggered via C++ callbacks)
- **Levels**: JSON-driven (`public/levels/*.json`) — spawn, platforms, goals, camera bounds
- **Deployment**: `deploy.py` (paramiko SFTP to 1ink.us)

## Key Architecture (Quick Map)

```
C++ (cpp/src/)
  Game.cpp/.hpp          — physics, collision, particles, callbacks, level loading (embind)
  ParticleSystem.hpp
  Types.hpp              — Vec2, Platform, InputState, AnimationState, PlayerState
  main.cpp               — EMSCRIPTEN_BINDINGS (value objects + Game class exposure)

TS/React (src/)
  wasm/loader.ts         — TS mirrors of embind types + dynamic script loader for the glue
  components/GameCanvas.tsx — owns rAF loop, input, WASM instance, level load, volume, callbacks
  gl/renderer.ts         — WebGL2 setup, texture loading, foot-anchor math, drawScene
  gl/shaders/            — tex.* (sprites), background.* (parallax)
  audio/AudioManager.ts  — music/SFX via Web Audio, resumes on gesture
```

**Important**: The WASM glue is an ES module factory named `createWasmModule` (see package.json build:wasm). The loader still contains legacy fallback paths for older `game.js` + `createGameModule` names — keep them in sync.

## Directory Structure (Relevant)

```
.
├── cpp/src/
│   ├── main.cpp, Game.{cpp,hpp}, ParticleSystem.hpp, Types.hpp
├── src/
│   ├── wasm/loader.ts
│   ├── gl/{renderer.ts,shaders/}
│   ├── audio/AudioManager.ts
│   ├── components/{GameCanvas.tsx,App.tsx}
│   └── main.tsx
├── public/
│   ├── levels/test-1.json
│   ├── wazzy_spritesheet.png (3 rows: idle/run/jump)
│   ├── platform.png, background.png
│   ├── *.mp3 (background-music, jump, land)
│   └── shaders/ (older copies, not used by current renderer)
├── package.json (scripts: dev/build:wasm/build/preview + emcc flags)
├── deploy.py (⚠️ hardcoded password)
├── CLAUDE.md (authoritative architecture doc)
└── vite.config.ts
```

## Build & Run Commands

```bash
# One-time
npm install
# Emscripten SDK must be on PATH (emcc)

# Normal development (builds WASM first, then Vite)
npm run dev

# WASM only (outputs src/wasm/main.js + main.wasm)
npm run build:wasm

# Full production build
npm run build

npm run preview
npm run lint
# optional auto-fix pass
npm run lint:fix

npm run test       # Vitest unit tests
npm run test:e2e   # Playwright smoke test (stubs WASM; no emcc required)
```

After `build:wasm` you should see `src/wasm/main.js` and `main.wasm`. Vite serves the `src/` tree during dev.

**Deploy**
```bash
npm run build
python deploy.py   # uploads dist/ → go.1ink.us/platformer
```

## Grok Guidelines

- **Bridge contract is sacred**: Any change to C++ exposed methods (Game.hpp), structs in Types.hpp, or the EMSCRIPTEN_BINDINGS block in main.cpp **must** be mirrored in `src/wasm/loader.ts` interfaces + usage sites in GameCanvas.tsx. Test the full round-trip (input → update → getters → render) after binding changes.

- **Level JSON is the source of truth for content**: Prefer adding new platforms/goals/spawn/bounds via `public/levels/` JSON files and `Game::loadLevel`. Only fall back to the hardcoded defaults in Game.cpp when no level is supplied.

- **Game juice lives in two places**: Particles and state machine are in C++ (emit on jump/land/run). Visual polish (shake, flash, timing) would be added in the TS renderer or by extending the data passed each frame. Keep the two sides in balance.

- **Animation + foot anchors**: The renderer computes per-frame vertical offsets from the spritesheet alpha to keep the 64×64 frames visually planted on the collision box. Changing the spritesheet layout or frame counts requires coordinated updates in `renderer.ts` (animationMap) and the C++ AnimationState logic.

- **Audio callbacks**: `setSoundCallback` is how C++ requests "jump" or "land" SFX. The callback must be registered early and must not throw. Music is started by the TS side on first gesture.

- **Emscripten / WASM gotchas**:
  - `emcc` must be available; builds fail silently-ish if missing.
  - Vector return types (PlatformList, ParticleList) are accessed via `.size()` + `.get(i)` in JS — never treat them as real arrays.
  - Callbacks (sound, levelComplete) are `emscripten::val` — store them and invoke as functions.
  - Memory: the Game instance is manually `delete()`d in the cleanup effect.

- **Coordinate system**: World units, Y-up, player origin at center. Camera follows player X (with optional bounds clamping). The viewport is ~10 world units wide (aspect-corrected).

- **Use todo_write for anything 3+ steps**: Especially binding changes, new mechanics, or cross-language refactors.

- **Tests exist now**: `npm run test` covers shared TS helpers, and `npm run test:e2e` uses a Playwright smoke test with a stubbed WASM module. The full WASM build still requires `emcc`, but the smoke test does not.

## Common Tasks

- New platforming mechanic (wall jump, dash, variable jump height) → C++ Game + bindings → TS input handling if needed → test feel.
- New level or procedural generation → extend JSON schema + loader + C++ parser.
- Visual effects (screen shake, particles on GPU, better lighting) → mostly renderer.ts + shaders.
- More sprite states / animation frames → update spritesheet + animationMap + C++ state machine.
- Sound design improvements or new SFX triggers.
- Clean up the loader/build mismatch (make the dev experience bulletproof).
- Mobile/touch controls.

## Security & Deployment Notes

- `deploy.py` contains a **hardcoded password** (`'GoogleBez12!'` at line ~45). This is consistent across several projects in this workspace. Do not expose the value in logs, issues, or new code. Long-term fix: switch to SSH keys or a small secrets file ignored by git.
- No `.env`, no CSP, no rate limiting on the static host.
- WASM is loaded from the same origin; no special COOP/COEP headers are currently required (no SharedArrayBuffer usage yet).

## Quick Tips

- When the game feels "floaty" or collisions are off, the debug overlay in GameCanvas (nearest platform top vs player bottom) is your friend — enable/inspect it during work.
- Spritesheet rows are 0=idle (2f), 1=run (4f), 2=jump (1f).
- The background shader does simple camera-based parallax scrolling.

**When starting any non-trivial session, read both `grok.md` and `CLAUDE.md`.**

Let's make Wazzy's jumps feel perfect and the levels sing. 🐕⚡
