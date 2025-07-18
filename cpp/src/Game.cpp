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
    
    // FIX: Only apply gravity if the player is in the air.
    // This uses the result from the *previous* frame to prevent jittering.
    if (!isGrounded) {
        playerVelocity.y += gravity * deltaTime;
    }

    // Apply horizontal movement
    playerPosition.x += playerVelocity.x * deltaTime;
    // (In the future, we would add checks for wall collisions here)

    // Apply vertical movement
    playerPosition.y += playerVelocity.y * deltaTime;

    // --- Collision Resolution ---
    isGrounded = false; // Assume we are in the air until a collision proves otherwise.
    for (const auto& platform : platforms) {
        if (checkCollision(playerPosition, playerSize, platform.position, platform.size)) {
            float playerBottom = playerPosition.y - playerSize.y / 2.0f;
            float platformTop = platform.position.y + platform.size.y / 2.0f;

            // If we are moving down and intersecting the platform from above, it's a landing.
            if (playerVelocity.y <= 0 && playerBottom < platformTop) {
                // Snap the player to the top of the platform
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
