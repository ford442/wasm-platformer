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
    // First, we apply the horizontal movement.
    playerPosition.x += playerVelocity.x * deltaTime;
    // (In a full game, we would check for wall collisions here and resolve them)

    // --- Vertical Movement ---
    // Next, we apply gravity and vertical velocity.
    playerVelocity.y += gravity * deltaTime;
    playerPosition.y += playerVelocity.y * deltaTime;

    // --- Collision Resolution ---
    // Now, we check for collisions and correct the player's position.
    isGrounded = false;
    for (const auto& platform : platforms) {
        if (checkCollision(playerPosition, playerSize, platform.position, platform.size)) {
            // We only resolve collisions if the player is moving downwards.
            // This prevents the player from getting stuck in the ceiling of a platform.
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
                    // We've landed on a platform, so we can stop checking for this frame.
                    break; 
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
