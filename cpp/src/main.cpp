#include "Game.hpp"
#include <emscripten/bind.h>

// Using emscripten::bind to expose the C++ classes and functions to JavaScript.
EMSCRIPTEN_BINDINGS(WASM_Venture) {
    // Expose the Position struct and its fields.
    emscripten::value_object<Position>("Position")
        .field("x", &Position::x)
        .field("y", &Position::y);

    // Expose the Game class, its constructor, and its methods.
    emscripten::class_<Game>("Game")
        .constructor<>()
        .function("update", &Game::update)
        .function("getPlayerPosition", &Game::getPlayerPosition);
}
