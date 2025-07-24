#include <emscripten/bind.h>
#include "Game.hpp"

EMSCRIPTEN_BINDINGS(my_module) {
    // This tells Emscripten how to handle a vector of floats,
    // which is what our render data functions return.
    emscripten::register_vector<float>("FloatList");

    // This exposes our main Game class to JavaScript.
    emscripten::class_<Game>("Game")
        // Expose the constructor so we can create a new Game object in JS
        .constructor<>() 
        
        // Expose the 'update' function
        // JS call: game.update(left, right, jump);
        .function("update", &Game::update) 

        // Expose the function to get all renderable object data
        // JS call: const data = game.getRenderData();
        .function("getRenderData", &Game::getRenderData) 

        // Expose the function to get background data
        // JS call: const bgData = game.getBackgroundData();
        .function("getBackgroundData", &Game::getBackgroundData)

        // Expose the function to get sound effect triggers
        // JS call: const soundData = game.getSoundData();
        .function("getSoundData", &Game::getSoundData);
}
