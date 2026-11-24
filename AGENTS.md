# Yuuka — GPT-6.2 / ChatGPT Web 3D

## Scope
Original procedural recreation of the supplied reference. Work only in this project, on Ruby host through wtruby when available. Read task.md and agent/continue.md before modifying. The reference is for direct visual comparison only: never use it as a model texture or extract assets from it. No external art assets.

## Structure
- src/geometry.js: parametric surface, ring, sweep, curved patch, original canvas texture generators.
- src/head.js: face, eyes, hair, bow, headband, halo.
- src/body.js: garment topology, limb meshes, pillow, slippers.
- src/materials.js: materials, original cat-print texture.
- src/main.js and style.css: renderer, camera, explicit WebGPU/WebGL selection, mobile UI, export.
- tests/render.mjs, webgpu.mjs, showcase.mjs, monitor.sh: GPU-backed renders, exports, video and one-second resource logs.
- dist/: production web build and showcase outputs. Generated, not the editable source branch.
- agent/: status, next-agent prompt, iteration record and archive.

## Workflow
Check git status and worktrees before starting, create a model-named branch, preserve prior work and archive old continuation/status docs. Never use an unverified score as a stopping condition. Measure build/test duration and inspect front, both sides, back, three-quarter and detail images. Use the native Chromium binary with a clean GPU environment; see README. WebGPU is default; if unavailable, ask the user to select WebGL 2, never silently switch. Keep the default render resolution at 900x1200. On narrow mobile screens the CSS display is half-size capped by available width.

Do not publish to ChatGPT Sites, Library, or Space without explicit permission. Public cloud deployment requested in task.md. Do not publish the reference PNG. Only commit project source and intentional outputs; never include credentials, node_modules, or raw base64. Update agent/status.md and agent/continue.md before handoff.

Latest checkpoint: iteration 27, subjective 95/100. The target remains 98/100. Read agent/status.md and agent/continue.md for remaining work.
