#include <iostream>
#include <emscripten/bind.h>

// This is our first C++ function that we will call from JavaScript.
// It's a simple function that returns an integer.
int get_player_start_x() {
    // In the future, this could read from a level file or game state.
    // For now, we'll just return a hardcoded value.
    return 100;
}

// This is the binding code that exposes our C++ function to JavaScript.
// We are creating a module named "WASM_Venture" and adding our function to it.
EMSCRIPTEN_BINDINGS(WASM_Venture) {
    emscripten::function("getPlayerStartX", &get_player_start_x);
}
