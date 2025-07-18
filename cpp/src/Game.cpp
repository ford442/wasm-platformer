#include "Game.hpp"
#include <cmath>

Game::Game() {
    playerPosition = {0.0f, 0.0f};
    playerVelocity = {0.0f, 0.0f};
}

// New method to update player velocity based on input
void Game::handleInput(const InputState& input) {
    if (input.left) {
        playerVelocity.x = -moveSpeed;
    } else if (input.right) {
        playerVelocity.x = moveSpeed;
    } else {
        playerVelocity.x = 0; // Stop moving if no horizontal input
    }

    if (input.jump && isGrounded) {
        playerVelocity.y = jumpStrength;
        isGrounded = false;
    }
}

void Game::update(float deltaTime) {
    // --- Physics Update ---

    // Apply gravity
    playerVelocity.y += gravity * deltaTime;

    // Update position based on velocity
    playerPosition.x += playerVelocity.x * deltaTime;
    playerPosition.y += playerVelocity.y * deltaTime;

    // --- Simple Collision Detection (floor) ---
    // This is a temporary floor to prevent falling forever.
    if (playerPosition.y < -0.5f) {
        playerPosition.y = -0.5f;
        playerVelocity.y = 0;
        isGrounded = true;
    }
}

Vec2 Game::getPlayerPosition() const {
    return playerPosition;
}
