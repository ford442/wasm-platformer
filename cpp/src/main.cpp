#include <emscripten/bind.h>
#include "Game.hpp"

EMSCRIPTEN_BINDINGS(my_module) {
    emscripten::register_vector<float>("FloatList");
    emscripten::class_<Game>("Game")
        .constructor<>() 
        .function("update", &Game::update) 
        .function("getRenderData", &Game::getRenderData) 
        .function("getBackgroundData", &Game::getBackgroundData)
        .function("getSoundData", &Game::getSoundData);
}
