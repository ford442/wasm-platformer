#include "Game.hpp"
#include <cmath>

Game::Game() {
    playerPosition = {0.0f, 0.5f};
    playerVelocity = {0.0f, 0.0f};
    playerSize = {0.2f, 0.2f};
    cameraPosition = {0.0f, 0.0f};
    
    // NEW: Initialize animation state.
    playerAnimation = {"idle", 0, false};

    // Level layout...
    platforms.push_back({ {0.0f, -0.8f}, {2.0f, 0.2f} });
    platforms.push_back({ {2.0f, -0.6f}, {1.0f, 0.2f} });
    platforms.push_back({ {4.0f, -0.4f}, {1.0f, 0.2f} });
    platforms.push_back({ {6.0f, -0.2f}, {1.5f, 0.2f} });
}

void Game::handleInput(const InputState& input) {
    if (input.left) {
        playerVelocity.x = -moveSpeed;
        playerAnimation.facingLeft = true; // NEW: Update direction
    } else if (input.right) {
        playerVelocity.x = moveSpeed;
        playerAnimation.facingLeft = false; // NEW: Update direction
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
    // --- Physics and Collision (same as before) ---
    if (!isGrounded) { playerVelocity.y += gravity * deltaTime; }
    playerPosition.x += playerVelocity.x * deltaTime;
    playerPosition.y += playerVelocity.y * deltaTime;
    isGrounded = false;
    for (const auto& platform : platforms) {
        if (checkCollision(playerPosition, playerSize, platform.position, platform.size)) {
            if (playerVelocity.y <= 0) {
                float playerBottom = playerPosition.y - playerSize.y / 2.0f;
                float platformTop = platform.position.y + platform.size.y / 2.0f;
                if (playerBottom < platformTop) {
                    float penetration = platformTop - playerBottom;
                    playerPosition.y += penetration;
                    playerVelocity.y = 0;
                    isGrounded = true;
                    break; 
                }
            }
        }
    }

    // --- NEW: Animation Logic ---
    // Determine the current animation state.
    if (!isGrounded) {
        playerAnimation.currentState = "jump";
    } else if (playerVelocity.x != 0) {
        playerAnimation.currentState = "run";
    } else {
        playerAnimation.currentState = "idle";
    }

    // Update the animation frame based on a timer.
    animationTimer += deltaTime;
    float frameDuration = 0.1f; // Change frame every 0.1 seconds
    if (animationTimer > frameDuration) {
        animationTimer = 0.0f;
        // This is a simple animation loop. We'll define the number of frames on the frontend.
        playerAnimation.currentFrame = (playerAnimation.currentFrame + 1);
    }

    // --- Update Camera ---
    cameraPosition.x = playerPosition.x;
}

// ... (checkCollision remains the same)
bool Game::checkCollision(const Vec2& posA, const Vec2& sizeA, const Vec2& posB, const Vec2& sizeB) { /* ... */ return false; }
Vec2 Game::getPlayerPosition() const { return playerPosition; }
const std::vector<Platform>& Game::getPlatforms() const { return platforms; }
Vec2 Game::getCameraPosition() const { return cameraPosition; }
// NEW: Implement the animation state getter.
AnimationState Game::getPlayerAnimationState() const { return playerAnimation; }

