#include "Game.hpp"
#include <cmath>

Game::Game() {
    playerPosition = {0.0f, 0.5f};
    // NEW: Initialize previous position to the starting position.
    previousPlayerPosition = playerPosition; 
    playerVelocity = {0.0f, 0.0f};
    playerSize = {0.2f, 0.2f};
    cameraPosition = {0.0f, 0.0f};

    // Level layout
    platforms.push_back({ {0.0f, -0.8f}, {2.0f, 0.2f} });
    platforms.push_back({ {2.0f, -0.6f}, {1.0f, 0.2f} });
    platforms.push_back({ {4.0f, -0.4f}, {1.0f, 0.2f} });
    platforms.push_back({ {6.0f, -0.2f}, {1.5f, 0.2f} });
    platforms.push_back({ {8.0f, 0.0f},  {0.5f, 0.2f} });
    platforms.push_back({ {6.0f, 0.6f},  {1.0f, 0.2f} });
    platforms.push_back({ {3.0f, 0.4f},  {1.0f, 0.2f} });
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
    // --- Physics Update ---
    // Apply gravity first
    playerVelocity.y += gravity * deltaTime;

    // --- Horizontal Movement and Collision ---
    playerPosition.x += playerVelocity.x * deltaTime;
    // Note: A real game would check for wall collisions here.

    // --- Vertical Movement and Collision ---
    playerPosition.y += playerVelocity.y * deltaTime;

    isGrounded = false;

    for (const auto& platform : platforms) {
        // Use the generic AABB check first
        if (checkCollision(playerPosition, playerSize, platform.position, platform.size)) {
            float playerBottom = playerPosition.y - playerSize.y / 2.0f;
            float platformTop = platform.position.y + platform.size.y / 2.0f;
            
            // Check if the player was previously above the platform
            float previousPlayerBottom = previousPlayerPosition.y - playerSize.y / 2.0f;

            // If the player is moving down and was previously above the platform,
            // it's a landing.
            if (playerVelocity.y <= 0 && previousPlayerBottom >= platformTop) {
                playerPosition.y = platformTop + playerSize.y / 2.0f;
                playerVelocity.y = 0;
                isGrounded = true;
                break; // Stop checking after a successful landing
            }
            // Note: A real game would also handle collisions from the sides and bottom here.
        }
    }
    
    // Store the final position for the next frame's calculation
    previousPlayerPosition = playerPosition;

    // --- Update Camera ---
    cameraPosition.x = playerPosition.x;
}

// AABB collision check
bool Game::checkCollision(const Vec2& posA, const Vec2& sizeA, const Vec2& posB, const Vec2& sizeB) {
    bool collisionX = (posA.x - sizeA.x / 2.0f < posB.x + sizeB.x / 2.0f) &&
                      (posA.x + sizeA.x / 2.0f > posB.x - sizeB.x / 2.0f);
    bool collisionY = (posA.y - sizeA.y / 2.0f < posB.y + sizeB.y / 2.0f) &&
                      (posA.y + sizeA.y / 2.0f > posB.y - sizeB.y / 2.0f);
    return collisionX && collisionY;
}

Vec2 Game::getPlayerPosition() const { return playerPosition; }
const std::vector<Platform>& Game::getPlatforms() const { return platforms; }
Vec2 Game::getCameraPosition() const { return cameraPosition; }
