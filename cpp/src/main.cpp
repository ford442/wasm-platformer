#include "Game.hpp"
#include <emscripten/bind.h>

EMSCRIPTEN_BINDINGS(WASM_Venture) {
    emscripten::value_object<Vec2>("Vec2")
        .field("x", &Vec2::x)
        .field("y", &Vec2::y);
        
    emscripten::value_object<Platform>("Platform")
        .field("position", &Platform::position)
        .field("size", &Platform::size);

    emscripten::register_vector<Platform>("PlatformList");

    emscripten::value_object<InputState>("InputState")
        .field("left", &InputState::left)
        .field("right", &InputState::right)
        .field("jump", &InputState::jump);

    // Bind the AnimationState struct.
    emscripten::value_object<AnimationState>("AnimationState")
        .field("currentState", &AnimationState::currentState)
        .field("currentFrame", &AnimationState::currentFrame)
        .field("facingLeft", &AnimationState::facingLeft);

    // Bind the full Game class.
    emscripten::class_<Game>("Game")
        .constructor<>()
        .function("update", &Game::update)
        .function("handleInput", &Game::handleInput)
        .function("getPlayerPosition", &Game::getPlayerPosition)
        .function("getCameraPosition", &Game::getCameraPosition)
        .function("getPlatforms", &Game::getPlatforms)
        // Bind the animation state getter.
        .function("getPlayerAnimationState", &Game::getPlayerAnimationState);
}
