#include "Game.hpp"
#include "ParticleSystem.hpp"
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

    emscripten::value_object<AnimationState>("AnimationState")
        .field("currentState", &AnimationState::currentState)
        .field("currentFrame", &AnimationState::currentFrame)
        .field("facingLeft", &AnimationState::facingLeft);

    emscripten::value_object<Particle>("Particle")
        .field("position", &Particle::position)
        .field("velocity", &Particle::velocity)
        .field("life", &Particle::life)
        .field("maxLife", &Particle::maxLife)
        .field("size", &Particle::size)
        .field("rotation", &Particle::rotation)
        .field("angularVelocity", &Particle::angularVelocity);

    emscripten::register_vector<Particle>("ParticleList");

    emscripten::class_<Game>("Game")
        .constructor<>()
        .function("update", &Game::update)
        .function("handleInput", &Game::handleInput)
        .function("getPlayerPosition", &Game::getPlayerPosition)
        .function("getCameraPosition", &Game::getCameraPosition)
        .function("getPlatforms", &Game::getPlatforms)
        .function("getParticles", &Game::getParticles)
        .function("getPlayerAnimationState", &Game::getPlayerAnimationState)
        .function("getPlayerSize", &Game::getPlayerSize)
        .function("setSoundCallback", &Game::setSoundCallback)
        .function("loadLevel", &Game::loadLevel)
        .function("setLevelCompleteCallback", &Game::setLevelCompleteCallback);
}
