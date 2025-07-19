#include "Game.hpp"
#include <cmath>
#include <algorithm>

Game::Game() {
    playerPosition = {0.0f, 0.5f};
    playerVelocity = {0.0f, 0.0f};
    playerSize = {0.3f, 0.3f}; // Using the larger player size
    cameraPosition = {0.0f, 0.0f};
    playerAnimation = {"idle", 0, false};

    // Level layout
    platforms.push_back({ {0.0f, -0.8f}, {2.0f, 0.2f} });
    platforms.push_back({ {2.0f, -0.6f}, {1.0f, 0.2f} });
    platforms.push_back({ {4.0f, -0.4f}, {1.0f, 0.2f} });
    platforms.push_back({ {6.0f, -0.2f}, {1.5f, 0.2f} });
}

void Game::handleInput(const InputState& input) {
    if (input.left) {
        playerVelocity.x = -moveSpeed;
        playerAnimation.facingLeft = true;
    } else if (input.right) {
        playerVelocity.x = moveSpeed;
        playerAnimation.facingLeft = false;
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
    // --- Apply Forces ---
    if (!isGrounded) {
        playerVelocity.y += gravity * deltaTime;
    }
    playerPosition.x += playerVelocity.x * deltaTime;
    playerPosition.y += playerVelocity.y * deltaTime;

    // --- Collision Resolution ---
    isGrounded = false;
    for (const auto& platform : platforms) {
        if (checkCollision(playerPosition, playerSize, platform.position, platform.size)) {
            float playerHalfX = playerSize.x / 2.0f;
            float playerHalfY = playerSize.y / 2.0f;
            float platformHalfX = platform.size.x / 2.0f;
            float platformHalfY = platform.size.y / 2.0f;

            float deltaX = playerPosition.x - platform.position.x;
            float penetrationX = (playerHalfX + platformHalfX) - std::abs(deltaX);

            float deltaY = playerPosition.y - platform.position.y;
            float penetrationY = (playerHalfY + platformHalfY) - std::abs(deltaY);

            if (penetrationY < penetrationX) {
                // Vertical collision
                if (deltaY > 0) { // Player is above the platform center
                    playerPosition.y += penetrationY;
                    if (playerVelocity.y < 0) {
                        playerVelocity.y = 0;
                    }
                    isGrounded = true;
                } else { // Player is below the platform center
                    playerPosition.y -= penetrationY;
                    if (playerVelocity.y > 0) {
                        playerVelocity.y = 0;
                    }
                }
            } else {
                // Horizontal collision
                if (deltaX > 0) { // Player is to the right of the platform center
                    playerPosition.x += penetrationX;
                } else {
                    playerPosition.x -= penetrationX;
                }
                playerVelocity.x = 0;
            }
        }
    }
    
    // --- Animation Logic ---
    std::string newState = "idle";
    if (!isGrounded) {
        newState = "jump";
    } else if (playerVelocity.x != 0) {
        newState = "run";
    }

    if (newState != playerAnimation.currentState) {
        playerAnimation.currentState = newState;
        playerAnimation.currentFrame = 0;
        animationTimer = 0.0f;
    }

    animationTimer += deltaTime;
    if (animationTimer > 0.1f) {
        animationTimer = 0.0f;
        playerAnimation.currentFrame = (playerAnimation.currentFrame + 1);
    }

    // --- Update Camera ---
    cameraPosition.x = playerPosition.x;
}

bool Game::checkCollision(const Vec2& posA, const Vec2& sizeA, const Vec2& posB, const Vec2& sizeB) {
    bool collisionX = (posA.x - sizeA.x / 2.0f < posB.x + sizeB.x / 2.0f) &&
                      (posA.x + sizeA.x / 2.0f > posB.x - sizeB.x / 2.0f);
    bool collisionY = (posA.y - sizeA.y / 2.0f < posB.y + sizeB.y / 2.0f) &&
                      (posA.y + sizeA.y / 2.0f > posB.y - sizeB.y / 2.0f);
    return collisionX && collisionY;
}

Vec2 Game::getPlayerPosition() const { return playerPosition; }
const std::vector<Platform>& Game::getPlatforms() const { return platforms; }
Vec2 Game::getPlayerSize() const { return playerSize; }
Vec2 Game::getCameraPosition() const { return cameraPosition; }
AnimationState Game::getPlayerAnimationState() const { return playerAnimation; }
