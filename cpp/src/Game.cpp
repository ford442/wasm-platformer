#include "Game.hpp"
#include <cmath>
#include <optional>
#include <algorithm>

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
    // Apply gravity
    playerVelocity.y += gravity * deltaTime;

    // Create a copy of velocity to use for this frame's movement
    Vec2 frameVelocity = {playerVelocity.x * deltaTime, playerVelocity.y * deltaTime};

    isGrounded = false;

    // --- Collision Detection and Resolution ---
    // This is a simplified model. A real game would need a more robust solution,
    // like iterating multiple times to handle complex interactions.

    for (const auto& platform : platforms) {
        auto collisionTime = checkCollision(playerPosition, playerSize, frameVelocity, platform.position, platform.size);

        if (collisionTime.has_value()) {
            float t = collisionTime.value();

            // Allow movement up to the point of collision
            playerPosition.x += frameVelocity.x * t;
            playerPosition.y += frameVelocity.y * t;

            // --- Determine Collision Normal ---
            // This is a simplified way to guess the collision side.
            // A more robust method would use the exact point of contact.
            Vec2 overlap;
            overlap.x = (playerPosition.x + playerSize.x / 2.0f) - (platform.position.x - platform.size.x / 2.0f);
            overlap.y = (playerPosition.y + playerSize.y / 2.0f) - (platform.position.y - platform.size.y / 2.0f);

            Vec2 platformOverlap;
            platformOverlap.x = (platform.position.x + platform.size.x/2.0f) - (playerPosition.x - playerSize.x/2.0f);
            platformOverlap.y = (platform.position.y + platform.size.y/2.0f) - (playerPosition.y - playerSize.y/2.0f);


            float minOverlapX = std::min(overlap.x, platformOverlap.x);
            float minOverlapY = std::min(overlap.y, platformOverlap.y);

            if (minOverlapY < minOverlapX) { // Vertical collision
                 if (playerVelocity.y <= 0) { // Moving down
                    playerVelocity.y = 0;
                    isGrounded = true;
                }
                 // If moving up, just stop y velocity
                 else {
                    playerVelocity.y = 0;
                 }
                 // Zero out the vertical component of the frame's velocity
                 frameVelocity.y = 0;
            } else { // Horizontal collision
                playerVelocity.x = 0;
                frameVelocity.x = 0;
            }
        }
    }

    // Apply the (potentially modified) frame velocity
    playerPosition.x += frameVelocity.x;
    playerPosition.y += frameVelocity.y;

    // --- Update Camera ---
    cameraPosition.x = playerPosition.x;
}

// Swept AABB collision check
std::optional<float> Game::checkCollision(const Vec2& posA, const Vec2& sizeA, const Vec2& velA, const Vec2& posB, const Vec2& sizeB) {
    // This is a simplified check, a full implementation would be more complex
    // We are looking for the time `t` (from 0 to 1) where the collision first occurs.

    Vec2 relativeVelocity = velA; // We assume platform B is static

    // Broad phase: Check if a collision is even possible
    Vec2 broadphaseBoxSize = {
        sizeA.x / 2.0f + sizeB.x / 2.0f + std::abs(relativeVelocity.x),
        sizeA.y / 2.0f + sizeB.y / 2.0f + std::abs(relativeVelocity.y)
    };
    if (posA.x + broadphaseBoxSize.x < posB.x - broadphaseBoxSize.x ||
        posA.x - broadphaseBoxSize.x > posB.x + broadphaseBoxSize.x ||
        posA.y + broadphaseBoxSize.y < posB.y - broadphaseBoxSize.y ||
        posA.y - broadphaseBoxSize.y > posB.y + broadphaseBoxSize.y) {
        return std::nullopt;
    }

    // Narrow phase: Calculate time of collision on each axis
    float t_near_x = (posB.x - sizeB.x / 2.0f - (posA.x + sizeA.x / 2.0f)) / relativeVelocity.x;
    float t_far_x = (posB.x + sizeB.x / 2.0f - (posA.x - sizeA.x / 2.0f)) / relativeVelocity.x;
    float t_near_y = (posB.y - sizeB.y / 2.0f - (posA.y + sizeA.y / 2.0f)) / relativeVelocity.y;
    float t_far_y = (posB.y + sizeB.y / 2.0f - (posA.y - sizeA.y / 2.0f)) / relativeVelocity.y;

    if (relativeVelocity.x == 0) {
        if (posA.x - sizeA.x / 2.0f >= posB.x + sizeB.x / 2.0f || posA.x + sizeA.x / 2.0f <= posB.x - sizeB.x / 2.0f)
            return std::nullopt; // No overlap on X, so no collision
        t_near_x = -std::numeric_limits<float>::infinity();
        t_far_x = std::numeric_limits<float>::infinity();
    }
     if (relativeVelocity.y == 0) {
        if (posA.y - sizeA.y / 2.0f >= posB.y + sizeB.y / 2.0f || posA.y + sizeA.y / 2.0f <= posB.y - sizeB.y / 2.0f)
            return std::nullopt; // No overlap on Y, so no collision
        t_near_y = -std::numeric_limits<float>::infinity();
        t_far_y = std::numeric_limits<float>::infinity();
    }

    // Ensure correct ordering
    if (t_near_x > t_far_x) std::swap(t_near_x, t_far_x);
    if (t_near_y > t_far_y) std::swap(t_near_y, t_far_y);

    // Find the latest time of entry and earliest time of exit
    float t_hit_near = std::max(t_near_x, t_near_y);
    float t_hit_far = std::min(t_far_x, t_far_y);

    // Check for no collision
    if (t_hit_near > t_hit_far || t_hit_near > 1.0f || t_hit_near < 0.0f) {
        return std::nullopt;
    }

    // Collision detected, return time of impact
    return t_hit_near;
}

Vec2 Game::getPlayerPosition() const { return playerPosition; }
const std::vector<Platform>& Game::getPlatforms() const { return platforms; }
Vec2 Game::getCameraPosition() const { return cameraPosition; }
