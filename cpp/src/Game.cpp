#include "Game.hpp"
#include <cmath>

Game::Game() {
    playerPosition = {0.0f, 0.5f};
    playerVelocity = {0.0f, 0.0f};
    playerSize = {0.2f, 0.2f};
    cameraPosition = {0.0f, 0.0f};
    
    // Initialize animation state.
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
    // --- Vertical Movement and Physics ---
    if (!isGrounded) {
        playerVelocity.y += gravity * deltaTime;
    }
    playerPosition.y += playerVelocity.y * deltaTime;

    // --- Collision Resolution ---
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

    // --- Horizontal Movement ---
    playerPosition.x += playerVelocity.x * deltaTime;
    // (Wall collision logic would go here)
    
    // --- Animation Logic ---
    if (!isGrounded) {
        playerAnimation.currentState = "jump";
    } else if (playerVelocity.x != 0) {
        playerAnimation.currentState = "run";
    } else {
        playerAnimation.currentState = "idle";
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
Vec2 Game::getCameraPosition() const { return cameraPosition; }
// The implementation for the animation state getter is re-added.
AnimationState Game::getPlayerAnimationState() const { return playerAnimation; }

