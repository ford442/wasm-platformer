#include "Game.hpp"
#include <emscripten/bind.h>

EMSCRIPTEN_BINDINGS(WASM_Venture) {
    // ... (Vec2, Platform, PlatformList, InputState bindings remain the same)
    emscripten::value_object<Vec2>("Vec2").field("x", &Vec2::x).field("y", &Vec2::y);
    emscripten::value_object<Platform>("Platform").field("position", &Platform::position).field("size", &Platform::size);
    emscripten::register_vector<Platform>("PlatformList");
    emscripten::value_object<InputState>("InputState").field("left", &InputState::left).field("right", &InputState::right).field("jump", &InputState::jump);

    // Expose the Game class and its methods
    emscripten::class_<Game>("Game")
        .constructor<>()
        .function("update", &Game::update)
        .function("handleInput", &Game::handleInput)
        .function("getPlayerPosition", &Game::getPlayerPosition)
        .function("getPlatforms", &Game::getPlatforms)
        // NEW: Expose the getCameraPosition method to JavaScript
        .function("getCameraPosition", &Game::getCameraPosition);
}
