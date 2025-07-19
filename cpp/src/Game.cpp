/*
================================================================================
  FILE: cpp/src/Game.cpp (FINAL, STABLE PHYSICS)
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

    // The wide, side-scrolling level layout
    platforms.push_back({ {0.0f, -0.8f}, {2.0f, 0.2f} });
    platforms.push_back({ {2.0f, -0.6f}, {1.0f, 2.0f} }); // Made this platform taller to act as a wall
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

    if (input.jump && isGrounded && canJump) {
        playerVelocity.y = jumpStrength;
        isGrounded = false;
        canJump = false;
    }

    if (!input.jump) {
        canJump = true;
    }
}

void Game::update(float deltaTime) {
    // --- Vertical Movement and Collision ---
    // Apply gravity if the player is not on the ground.
    if (!isGrounded) {
        playerVelocity.y += gravity * deltaTime;
    }
    // Update vertical position based on velocity.
    playerPosition.y += playerVelocity.y * deltaTime;

    // Assume we are in the air until a collision proves otherwise.
    isGrounded = false;
    for (const auto& platform : platforms) {
        if (checkCollision(playerPosition, playerSize, platform.position, platform.size)) {
            // If the player is moving downwards and intersecting the platform from above, it's a landing.
            if (playerVelocity.y <= 0) {
                float playerBottom = playerPosition.y - playerSize.y / 2.0f;
                float platformTop = platform.position.y + platform.size.y / 2.0f;

                // We only resolve the collision if the player is actually intersecting from above.
                if (playerBottom < platformTop) {
                    // Calculate how far the player has sunk into the platform.
                    float penetration = platformTop - playerBottom;
                    // Correct the player's position by moving them up by exactly that amount.
                    playerPosition.y += penetration;
                    
                    // Stop all vertical movement.
                    playerVelocity.y = 0;
                    isGrounded = true;
                }
            }
        }
    }

    // --- Horizontal Movement and Collision ---
    // Apply horizontal movement *after* all vertical physics and collisions are resolved.
    playerPosition.x += playerVelocity.x * deltaTime;
    // Check for horizontal collisions
    for (const auto& platform : platforms) {
        if (checkCollision(playerPosition, playerSize, platform.position, platform.size)) {
            float playerLeft = playerPosition.x - playerSize.x / 2.0f;
            float playerRight = playerPosition.x + playerSize.x / 2.0f;
            float platformLeft = platform.position.x - platform.size.x / 2.0f;
            float platformRight = platform.position.x + platform.size.x / 2.0f;

            // If moving right and hit a wall
            if (playerVelocity.x > 0 && playerRight > platformLeft) {
                float penetration = playerRight - platformLeft;
                playerPosition.x -= penetration;
                playerVelocity.x = 0;
            }
            // If moving left and hit a wall
            else if (playerVelocity.x < 0 && playerLeft < platformRight) {
                float penetration = platformRight - playerLeft;
                playerPosition.x += penetration;
                playerVelocity.x = 0;
            }
        }
    }
    
    // --- Update Camera ---
    // The camera's position is updated last, based on the final, stable player position.
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
