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
    // --- Horizontal Movement ---
    // Update horizontal position first
    playerPosition.x += playerVelocity.x * deltaTime;
    // (Future: Add horizontal collision checks here)

    // --- Vertical Movement ---
    playerVelocity.y += gravity * deltaTime;
    playerPosition.y += playerVelocity.y * deltaTime;

    isGrounded = false;

    // --- Collision Resolution ---
    for (const auto& platform : platforms) {
        // Broad-phase check: only check for collision if player is roughly at the same x-range
        if (playerPosition.x + playerSize.x > platform.position.x &&
            playerPosition.x < platform.position.x + platform.size.x)
        {
            // Check if player is falling and is intersecting the platform from above
            if (playerVelocity.y <= 0 &&
                (playerPosition.y - playerSize.y / 2.0f) < (platform.position.y + platform.size.y / 2.0f) &&
                (playerPosition.y - playerSize.y / 2.0f) > platform.position.y)
            {
                // Snap to the top of the platform
                playerPosition.y = platform.position.y + platform.size.y / 2.0f + playerSize.y / 2.0f;
                playerVelocity.y = 0;
                isGrounded = true;
                break; // Landed on a platform, no need to check others
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
