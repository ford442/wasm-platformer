#include "Game.hpp"
#include <emscripten/bind.h>

EMSCRIPTEN_BINDINGS(WASM_Venture) {
    // Expose Vec2 struct
    emscripten::value_object<Vec2>("Vec2")
        .field("x", &Vec2::x)
        .field("y", &Vec2::y);

    // Expose the new InputState struct so we can create it in JS
    emscripten::value_object<InputState>("InputState")
        .field("left", &InputState::left)
        .field("right", &InputState::right)
        .field("jump", &InputState::jump);

    // Expose the Game class and its methods, including the new handleInput
    emscripten::class_<Game>("Game")
        .constructor<>()
        .function("update", &Game::update)
        .function("handleInput", &Game::handleInput) // New binding
        .function("getPlayerPosition", &Game::getPlayerPosition);
}
