/*
================================================================================
  FILE: cpp/src/Game.cpp (Corrected)
================================================================================
  Instructions: Replace the contents of your existing Game.cpp file with this.
*/
#include "Game.hpp"
#include <cmath>

Game::Game() {
    playerPosition = {0.0f, 0.5f}; // Start a bit higher
    playerVelocity = {0.0f, 0.0f};
    playerSize = {0.2f, 0.1f}; // Player is 0.2x0.2 units

    // --- Define our level's platforms (Corrected Coordinates) ---
    // A wide floor within the screen bounds
    platforms.push_back({ {0.0f, -0.8f}, {1.8f, 0.2f} });
    // A platform on the right side
    platforms.push_back({ {0.7f, -0.2f}, {0.6f, 0.2f} });
    // A platform on the left side
    platforms.push_back({ {-0.7f, 0.2f}, {0.6f, 0.2f} });
}

void Game::handleInput(const InputState& input) {
    if (input.left) {
        playerVelocity.x = -moveSpeed;
    } else if (input.right) {
        playerVelocity.x = moveSpeed;
    } else {
        playerVelocity.x = 0;
    }

    if (input.jump && isGrounded) {
        playerVelocity.y = jumpStrength;
        isGrounded = false;
    }
}

void Game::update(float deltaTime) {
    // Apply gravity
    playerVelocity.y += gravity * deltaTime;

    // Update position based on velocity
    playerPosition.x += playerVelocity.x * deltaTime;
    playerPosition.y += playerVelocity.y * deltaTime;

    // Assume we are not grounded until a collision proves otherwise
    isGrounded = false;

    // --- Collision Detection and Resolution ---
    for (const auto& platform : platforms) {
        if (checkCollision(playerPosition, playerSize, platform.position, platform.size)) {
            // A simple collision resolution:
            // If the player was moving down, stop them on top of the platform.
            if (playerVelocity.y <= 0) {
                // Place player directly on top of the platform
                playerPosition.y = platform.position.y + (platform.size.y / 2) + (playerSize.y / 2);
                playerVelocity.y = 0;
                isGrounded = true;
            }
        }
    }
}

// AABB (Axis-Aligned Bounding Box) collision detection function
bool Game::checkCollision(const Vec2& posA, const Vec2& sizeA, const Vec2& posB, const Vec2& sizeB) {
    // Calculate the half-sizes for easier calculation
    float aHalfX = sizeA.x / 2.0f;
    float aHalfY = sizeA.y / 2.0f;
    float bHalfX = sizeB.x / 2.0f;
    float bHalfY = sizeB.y / 2.0f;

    // Check for overlap on the X axis
    bool collisionX = (posA.x + aHalfX >= posB.x - bHalfX) && (posB.x + bHalfX >= posA.x - aHalfX);
    // Check for overlap on the Y axis
    bool collisionY = (posA.y + aHalfY >= posB.y - bHalfY) && (posB.y + bHalfY >= posA.y - aHalfY);

    // Collision only occurs if there is overlap on both axes
    return collisionX && collisionY;
}

Vec2 Game::getPlayerPosition() const {
    return playerPosition;
}

const std::vector<Platform>& Game::getPlatforms() const {
    return platforms;
}
