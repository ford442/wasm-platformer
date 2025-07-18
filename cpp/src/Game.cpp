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
    // --- Horizontal Movement ---
    // Apply horizontal movement first.
    playerPosition.x += playerVelocity.x * deltaTime;
    // (A real game would check for wall collisions here)

    // --- Vertical Movement ---
    // Apply gravity and update vertical position.
    playerVelocity.y += gravity * deltaTime;
    playerPosition.y += playerVelocity.y * deltaTime;

    // --- Collision Resolution ---
    isGrounded = false;
    for (const auto& platform : platforms) {
        if (checkCollision(playerPosition, playerSize, platform.position, platform.size)) {
            float playerBottom = playerPosition.y - playerSize.y / 2.0f;
            float playerLeft = playerPosition.x - playerSize.x / 2.0f;
            float playerRight = playerPosition.x + playerSize.x / 2.0f;

            float platformTop = platform.position.y + platform.size.y / 2.0f;
            float platformLeft = platform.position.x - platform.size.x / 2.0f;
            float platformRight = platform.position.x + platform.size.x / 2.0f;

            // Check if the player is intersecting from above and moving downwards.
            if (playerVelocity.y <= 0 && playerBottom < platformTop && playerRight > platformLeft && playerLeft < platformRight) {
                // Calculate the penetration depth.
                float penetration = platformTop - playerBottom;
                // Correct the player's position by moving them up by exactly the penetration amount.
                playerPosition.y += penetration;
                
                // If the player's vertical velocity is significant, stop it.
                if (playerVelocity.y < 0) {
                    playerVelocity.y = 0;
                }
                isGrounded = true;
                break; // We've landed, no need to check other platforms.
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
