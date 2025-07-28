#include "Game.hpp"
#include <emscripten/bind.h>

EMSCRIPTEN_BINDINGS(WASM_Venture) {
    emscripten::value_object<Vec2>("Vec2")
        .field("x", &Vec2::x)
        .field("y", &Vec2::y);
    
emscripten::value_object<Enemy>("Enemy")
        .field("box", &Enemy::box);

    emscripten::value_object<Scenery>("Scenery")
        .field("box", &Scenery::box)
        .field("type", &Scenery::type);
    
    emscripten::value_object<Door>("Door")
        .field("box", &Door::box)
        .field("leads_to", &Door::leads_to);
    
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
    
  emscripten::value_object<GameState>("GameState")
        .field("is_paused", &GameState::is_paused)
        .field("level_transition_to", &GameState::level_transition_to);

    // NEW: Bind the vector types
    emscripten::register_vector<Enemy>("EnemyList");
    emscripten::register_vector<Scenery>("SceneryList");
    emscripten::register_vector<Door>("DoorList");
    emscripten::register_vector<Box>("PlatformList");
    
    emscripten::class_<Game>("Game")
        .constructor<int, int>()
        .function("loadLevel", &Game::loadLevel)
        .function("update", &Game::update)
        .function("getGameState", &Game::getGameState)
        .function("getPlayer", &Game::getPlayer)
        .function("getPlatforms", &Game::getPlatforms)
        // NEW: Bind the new getters
        .function("getEnemies", &Game::getEnemies)
        .function("getScenery", &Game::getScenery)
        .function("getDoors", &Game::getDoors);
}
