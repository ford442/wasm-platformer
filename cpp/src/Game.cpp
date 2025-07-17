#include "Game.hpp"
#include <cmath> // For std::sin

// Constructor
Game::Game() {
    playerPosition.x = 0.0f;
    playerPosition.y = 0.0f;
    time = 0.0f;
}

// The main update function
void Game::update(float deltaTime) {
    time += deltaTime;

    // Create a simple back-and-forth movement using a sine wave.
    // The position will oscillate between -0.5 and 0.5.
    playerPosition.x = std::sin(time) * 0.5f;
    // We'll keep Y constant for now.
    playerPosition.y = 0.0f;
}

// Getter for the player's position
Position Game::getPlayerPosition() const {
    return playerPosition;
}
