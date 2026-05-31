# Bolts & Volts

**Two robot dogs. One very important delivery.**

Bolts & Volts are specialized **OLTS** (Omni-Language-Transfer-Service) units deployed on long-range space courier missions. They transport encrypted data, sensitive packages, and occasionally questionable cargo across dangerous routes.

Bolts handles heavy, armored transport.  
Volts handles high-tech logistics, holographics, and multi-format communication.

Same bark. Different payload. Choose your chaos.

## BOLTS & VOLTS

| Unit      | Full Name                                           | Specialization                     |
|-----------|-----------------------------------------------------|------------------------------------|
| **BOLTS**     | **B**ody-**O**perated **L**ogistics **T**ransfer **S**ervice     | Heavy armored transport, physical operations, and heavy lifting |
| **VOLTS**     | **V**ersatile **O**mni-**L**anguage **T**ransfer **S**ervice     | High-tech data handling, holographics, and multi-format communication |

Both units are part of the **OLTS** program — a fleet of specialized robot couriers designed for long-distance, high-stakes deliveries across space.

## Current Status

Early development. The core 2D platformer foundation is in place and the goal right now is to make the game properly playable and testable.

- C++ game logic compiled to WebAssembly
- Custom WebGL2 rendering
- Working player physics, collision, and jumping
- React frontend with game loop

## Tone & Vibe

Silly, but with real danger and action. Expect sarcastic robot dialogue, over-the-top threats (including robotic space cats), and gameplay that supports both physical platforming and tech-based problem solving.

## Features (Current)

- Hybrid C++ / WebAssembly core
- WebGL2 rendering
- Platforming physics and collision
- Level loading from JSON
- Manifest-driven multi-map selection with in-game switching
- Particle effects
- Sound event hooks

## Level Background Layers

Levels can now define an optional `backgroundLayers` array for multi-depth parallax backgrounds:

```json
"backgroundLayers": [
  { "image": "./bg-sky.png", "scrollFactorX": 0.05, "scrollFactorY": 0.0, "scale": 1.0, "offsetY": 0.0 },
  { "image": "./bg-mountains.png", "scrollFactorX": 0.25, "scrollFactorY": 0.1, "scale": 1.2 }
]
```

Layers render in listed order (farthest first). If `backgroundLayers` is missing, the renderer keeps legacy behavior by using the single `./background.png` layer with the existing parallax look.

## Level Decor (Non-Collision Visuals)

Levels can optionally include a `decor` array for visual-only props that do not affect collision or goals:

```json
"decor": [
  { "image": "./wazzy.png", "position": { "x": 6.0, "y": -1.0 }, "size": { "x": 1.2, "y": 1.2 }, "layer": "distant", "parallaxFactor": 0.3 },
  { "texture": "./platform.png", "position": { "x": 18.0, "y": 0.5 }, "uv": [0, 0, 64, 64], "layer": "foreground", "parallaxX": 1.05, "parallaxY": 1.0, "offsetY": 0.2 }
]
```

Supported layer values are `distant`, `mid`, and `foreground` (default: `mid`). You can also set `visual: false` on individual `platforms` entries to keep collision while hiding the textured platform sprite.

## Tech Stack

- **Core Logic**: C++ → WebAssembly (Emscripten)
- **Rendering**: Custom WebGL2
- **Frontend**: React + TypeScript + Vite
- **Physics**: Custom implementation in C++

## Getting Started

```bash
git clone https://github.com/ford442/bolts_and_volts.git
cd bolts_and_volts
npm install
npm run dev
```

## Testing Instructions

```bash
npm run test       # Vitest unit tests
npm run test:e2e   # Playwright smoke test with a stubbed WASM module
npm run lint
```

The smoke test can run without an Emscripten build because it stubs the WASM module at the network layer. For a full game build, `npm run build:wasm` still requires `emcc` on `PATH`.

## Current Focus

Making the base platformer level feel good and stable so we can start properly testing and building on top of it. Dual-character mechanics and mission structure will come after the foundation is solid.

## Story Direction (Early)

Bolts and Volts are deployed on distant space delivery missions. Their job is to get the payload where it needs to go while dealing with interference from robotic space cats and other hazards.

The tone sits somewhere between:

> "BARK BARK. Payload delivered. Please sign for dents."
>
> Actual danger and action when things go wrong.

More OLTS units with specialized roles may appear later.

## Project Structure

```text
bolts_and_volts/
├── cpp/src/           # C++ game systems
├── src/gl/            # WebGL2 rendering
├── src/components/    # React game UI
├── public/levels/     # JSON level data
└── public/            # Static assets
```

## Next Steps (Planned)

- Improve core platforming feel and level design
- Flesh out basic dual-dog switching / ability differences
- Add simple mission structure and hazards
- Expand the level manifest into mission-select and campaign chaining
- Lean into the humorous tone with light dialogue and personality
