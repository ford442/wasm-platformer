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
    // NEW: Store the player's current position before we calculate the new one.
    previousPlayerPosition = playerPosition;

    // --- Physics Update ---
    playerPosition.x += playerVelocity.x * deltaTime;
    playerVelocity.y += gravity * deltaTime;
    playerPosition.y += playerVelocity.y * deltaTime;

    // --- Collision Detection and Resolution ---
    isGrounded = false;
    for (const auto& platform : platforms) {
        float playerBottom = playerPosition.y - playerSize.y / 2.0f;
        float playerLeft = playerPosition.x - playerSize.x / 2.0f;
        float playerRight = playerPosition.x + playerSize.x / 2.0f;

        float platformTop = platform.position.y + platform.size.y / 2.0f;
        float platformLeft = platform.position.x - platform.size.x / 2.0f;
        float platformRight = platform.position.x + platform.size.x / 2.0f;

        // Get the player's bottom position from the PREVIOUS frame.
        float previousPlayerBottom = previousPlayerPosition.y - playerSize.y / 2.0f;

        // Check for horizontal overlap
        if (playerRight > platformLeft && playerLeft < platformRight) {
            // NEW, MORE ROBUST CONDITION:
            // Check if the player WAS above or at the platform's top edge,
            // IS NOW below or at the platform's top edge, and is falling.
            if (playerVelocity.y <= 0 && previousPlayerBottom >= platformTop && playerBottom <= platformTop) {
                 // Snap player precisely to the top of the platform
                 playerPosition.y = platformTop + playerSize.y / 2.0f;
                 playerVelocity.y = 0;
                 isGrounded = true;
                 break; 
            }
        }
    }

    // --- Update Camera ---
    cameraPosition.x = playerPosition.x;
}

// ... (checkCollision function is no longer used for landing but can be kept)
bool Game::checkCollision(const Vec2& posA, const Vec2& sizeA, const Vec2& posB, const Vec2& sizeB) {
    bool collisionX = (posA.x + sizeA.x / 2.0f >= posB.x - sizeB.x / 2.0f) && (posB.x + sizeB.x / 2.0f >= posA.x - sizeA.x / 2.0f);
    bool collisionY = (posA.y + sizeA.y / 2.0f >= posB.y - sizeB.y / 2.0f) && (posB.y + sizeB.y / 2.0f >= posA.y - sizeA.y / 2.0f);
    return collisionX && collisionY;
}

Vec2 Game::getPlayerPosition() const { return playerPosition; }
const std::vector<Platform>& Game::getPlatforms() const { return platforms; }
Vec2 Game::getCameraPosition() const { return cameraPosition; }
