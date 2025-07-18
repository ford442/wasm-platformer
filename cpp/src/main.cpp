#include "Game.hpp"
#include <emscripten/bind.h>

EMSCRIPTEN_BINDINGS(WASM_Venture) {
    // Expose Vec2 struct
    emscripten::value_object<Vec2>("Vec2")
        .field("x", &Vec2::x)
        .field("y", &Vec2::y);
        
    // Expose the Platform struct
    emscripten::value_object<Platform>("Platform")
        .field("position", &Platform::position)
        .field("size", &Platform::size);

    // Expose std::vector<Platform> so we can pass it to JS
    emscripten::register_vector<Platform>("PlatformList");

    // Expose the InputState struct
    emscripten::value_object<InputState>("InputState")
        .field("left", &InputState::left)
        .field("right", &InputState::right)
        .field("jump", &InputState::jump);

    // Expose the Game class and its methods
    emscripten::class_<Game>("Game")
        .constructor<>()
        .function("update", &Game::update)
        .function("handleInput", &Game::handleInput)
        .function("getPlayerPosition", &Game::getPlayerPosition)
        .function("getPlatforms", &Game::getPlatforms); // New binding
}
