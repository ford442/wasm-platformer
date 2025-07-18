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
    // --- Physics Update ---
    
    // CRITICAL FIX: Only apply gravity if the player is in the air.
    // This uses the 'isGrounded' state from the *previous frame* to decide.
    // This prevents gravity from being applied when the player is standing on a platform, which stops the jittering bug.
    if (!isGrounded) {
        playerVelocity.y += gravity * deltaTime;
    }

    // --- Horizontal Movement ---
    playerPosition.x += playerVelocity.x * deltaTime;
    // (In a full game, we would check for wall collisions here)

    // --- Vertical Movement ---
    playerPosition.y += playerVelocity.y * deltaTime;

    // --- Collision Resolution ---
    // First, assume we are in the air. A collision will prove otherwise.
    isGrounded = false; 
    for (const auto& platform : platforms) {
        if (checkCollision(playerPosition, playerSize, platform.position, platform.size)) {
            // We only resolve collisions if the player is moving downwards.
            if (playerVelocity.y <= 0) {
                float playerBottom = playerPosition.y - playerSize.y / 2.0f;
                float platformTop = platform.position.y + platform.size.y / 2.0f;

                // Check if the player is actually intersecting from above.
                if (playerBottom < platformTop) {
                    // Use penetration resolution to correct the position.
                    float penetration = platformTop - playerBottom;
                    playerPosition.y += penetration;
                    
                    // Stop all vertical movement and mark the player as grounded.
                    playerVelocity.y = 0;
                    isGrounded = true;
                    break; // We've landed, so we can stop checking other platforms.
                }
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
