#include "Game.hpp"
#include <cmath>

Game::Game() {
    playerPosition = {0.0f, 0.5f};
    playerVelocity = {0.0f, 0.0f};
    playerSize = {0.2f, 0.2f};
    cameraPosition = {0.0f, 0.0f}; // Camera starts at the origin

    // --- Define our NEW, WIDER level ---
    platforms.push_back({ {0.0f, -0.8f}, {2.0f, 0.2f} });  // Start platform
    platforms.push_back({ {2.0f, -0.6f}, {1.0f, 0.2f} });  // Step up
    platforms.push_back({ {4.0f, -0.4f}, {1.0f, 0.2f} });  // Step up again
    platforms.push_back({ {6.0f, -0.2f}, {1.5f, 0.2f} });  // Long platform
    platforms.push_back({ {8.0f, 0.0f},  {0.5f, 0.2f} });  // Small high platform
    platforms.push_back({ {6.0f, 0.6f},  {1.0f, 0.2f} });  // Secret high platform
    platforms.push_back({ {3.0f, 0.4f},  {1.0f, 0.2f} });  // Floating platform
}

void Game::handleInput(const InputState& input) {
    // ... (handleInput logic remains the same)
    if (input.left) { playerVelocity.x = -moveSpeed; } 
    else if (input.right) { playerVelocity.x = moveSpeed; } 
    else { playerVelocity.x = 0; }
    if (input.jump && isGrounded) { playerVelocity.y = jumpStrength; isGrounded = false; }
}

void Game::update(float deltaTime) {
    // --- Physics Update (remains the same) ---
    playerVelocity.y += gravity * deltaTime;
    playerPosition.x += playerVelocity.x * deltaTime;
    playerPosition.y += playerVelocity.y * deltaTime;

    // --- Collision Detection (remains the same) ---
    isGrounded = false;
    for (const auto& platform : platforms) {
        if (checkCollision(playerPosition, playerSize, platform.position, platform.size)) {
            if (playerVelocity.y <= 0) {
                playerPosition.y = platform.position.y + (platform.size.y / 2) + (playerSize.y / 2);
                playerVelocity.y = 0;
                isGrounded = true;
            }
        }
    }

    // --- NEW: Update Camera Position ---
    // Make the camera follow the player's X position.
    // We can add smoothing or bounds later.
    cameraPosition.x = playerPosition.x;
    // The camera doesn't move vertically for now.
    cameraPosition.y = 0.0f; 
}

// ... (checkCollision remains the same)
bool Game::checkCollision(const Vec2& posA, const Vec2& sizeA, const Vec2& posB, const Vec2& sizeB) {
    bool collisionX = (posA.x + sizeA.x / 2.0f >= posB.x - sizeB.x / 2.0f) && (posB.x + sizeB.x / 2.0f >= posA.x - sizeA.x / 2.0f);
    bool collisionY = (posA.y + sizeA.y / 2.0f >= posB.y - sizeB.y / 2.0f) && (posB.y + sizeB.y / 2.0f >= posA.y - sizeA.y / 2.0f);
    return collisionX && collisionY;
}

Vec2 Game::getPlayerPosition() const { return playerPosition; }
const std::vector<Platform>& Game::getPlatforms() const { return platforms; }
// NEW: Implement the camera position getter
Vec2 Game::getCameraPosition() const { return cameraPosition; }
