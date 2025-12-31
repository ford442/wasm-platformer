#  WASM-Venture


WASM-Venture is a 2D platformer adventure game that runs entirely in the browser, powered by C++ compiled to WebAssembly.🚀 


The player controls Wazzy, a small, agile dog robot who has crash-landed on an unknown planet. The goal is to navigate a series of levels, collect scattered ship parts, and overcome obstacles to repair the ship and return home.🛠️


Technical Architecture
Core Logic: C++
Compilation Target: WebAssembly (via Emscripten)
Frontend/Bridge: TypeScript
Rendering: WebGL2 vis HTML Canvas 📋
Current Status: We are setting up the initial project structure, C++ to WASM compilation pipeline, and basic player rendering.🏗️ 


How to Build and Run (Placeholder)


Prerequisites:

Emscripten SDKNode.js and npmTypeScript (npm install -g typescript)


Build Steps:

Clone the repository:

git clone https://github.com/ford442/wasm-platformer.git

cd wasm-platformer


Compile the C++ code to WebAssembly:

emcc cpp/src/main.cpp cpp/src/Game.cpp -o public/game.js -O3 -s WASM=1 -s MODULARIZE=1 -s 'EXPORT_NAME="createGameModule"' -lembind


Compile the TypeScript code:

npm install

mkdir -p public/materials

npm run build
