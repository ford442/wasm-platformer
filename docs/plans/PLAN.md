# PLAN.md — Near-Term Roadmap

## Current Focus

1. Stabilize the map pipeline for rich levels (camera, backgrounds, decor, manifest-based level switching).
2. Improve playability and feedback loops so level iteration is fast.
3. Prepare the repository for multi-contributor development (linting, docs consistency, release hygiene).

## Roadmap

## 1) Map System Hardening

- Expand level schema documentation (camera, backgroundLayers, decor, manifest).
- Add validation helpers for level JSON and clearer runtime warnings.
- Add optional per-level viewport settings and camera presets.

## 2) Multiple Levels & Flow

- Improve level-select UX (menu panel + keyboard shortcuts).
- Add level chaining semantics in manifest (explicit `next`).
- Support per-level music overrides from manifest/level metadata.

## 3) Gameplay Polish

- Refine movement feel (acceleration, air control, coyote/buffer windows).
- Improve particle/audio timing and event coverage.
- Add optional debug overlays for culling, camera bounds, and triggers.

## 4) Performance & Scale

- Add visible-rect culling across platforms/decor/particles.
- Introduce lightweight spatial partitioning for very large maps.
- Profile rendering costs for large generated background art.

## 5) Deployment & Release Hygiene

- Keep build + lint as required pre-merge checks.
- Document deployment flow and credential-safe alternatives.
- Start a release checklist tied to `CHANGELOG.md`.

## 6) Testing Foundations

- Add baseline automated checks (unit smoke + render/game-loop sanity).
- Add one or two deterministic level-load integration tests.
- Introduce CI wiring for lint + type-check + build.
