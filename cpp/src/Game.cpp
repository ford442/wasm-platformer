/*
================================================================================
  FILE: cpp/src/Game.cpp (Corrected Collision Logic)
================================================================================
  Instructions: Replace the contents of your existing Game.cpp file with this,
  then recompile your C++ to WebAssembly.
*/
#include "Game.hpp"
#include <cmath>

Game::Game() {
    playerPosition = {0.0f, 0.5f};
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
    // Apply horizontal movement first
    playerPosition.x += playerVelocity.x * deltaTime;

    // Apply gravity and vertical movement
    playerVelocity.y += gravity * deltaTime;
    playerPosition.y += playerVelocity.y * deltaTime;

    // --- Collision Detection and Resolution ---
    isGrounded = false;
    for (const auto& platform : platforms) {
        // Get the edges of the player and platform bounding boxes
        float playerBottom = playerPosition.y - playerSize.y / 2.0f;
        float playerTop = playerPosition.y + playerSize.y / 2.0f;
        float playerLeft = playerPosition.x - playerSize.x / 2.0f;
        float playerRight = playerPosition.x + playerSize.x / 2.0f;

        float platformTop = platform.position.y + platform.size.y / 2.0f;
        float platformBottom = platform.position.y - platform.size.y / 2.0f;
        float platformLeft = platform.position.x - platform.size.x / 2.0f;
        float platformRight = platform.position.x + platform.size.x / 2.0f;

        // Check for horizontal overlap
        if (playerRight > platformLeft && playerLeft < platformRight) {
            // Check if the player is falling and their bottom edge has just crossed the platform's top edge
            if (playerVelocity.y <= 0 && playerBottom <= platformTop && playerTop > platformTop) {
                 // Snap player to the top of the platform
                 playerPosition.y = platformTop + playerSize.y / 2.0f;
                 // Stop vertical movement
                 playerVelocity.y = 0;
                 // Mark the player as grounded
                 isGrounded = true;
                 // Since we've landed on a platform, we can stop checking for this frame
                 break; 
            }
        }
    }

    // --- Update Camera ---
    // The camera follows the player's horizontal position
    cameraPosition.x = playerPosition.x;
}

// ... (checkCollision function is no longer used but can be kept for other purposes)
bool Game::checkCollision(const Vec2& posA, const Vec2& sizeA, const Vec2& posB, const Vec2& sizeB) {
    bool collisionX = (posA.x + sizeA.x / 2.0f >= posB.x - sizeB.x / 2.0f) && (posB.x + sizeB.x / 2.0f >= posA.x - sizeA.x / 2.0f);
    bool collisionY = (posA.y + sizeA.y / 2.0f >= posB.y - sizeB.y / 2.0f) && (posB.y + sizeB.y / 2.0f >= posA.y - sizeA.y / 2.0f);
    return collisionX && collisionY;
}

Vec2 Game::getPlayerPosition() const { return playerPosition; }
const std::vector<Platform>& Game::getPlatforms() const { return platforms; }
Vec2 Game::getCameraPosition() const { return cameraPosition; }
