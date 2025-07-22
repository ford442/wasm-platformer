#include "Game.hpp"
#include <cmath>
#include <algorithm>

Game::Game() {
    playerPosition = {0.0f, 0.5f};
    playerVelocity = {0.0f, 0.0f};
    // Tweak: Make the collision box height smaller to match the sprite better.
    playerSize = {0.5f, 0.43f}; 
    cameraPosition = {0.0f, 0.0f};
    playerAnimation = {"idle", 0, false};
    isGrounded = false;
    canJump = true;

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
    bool onGroundThisFrame = false;
    // Tweak: Use a smaller tolerance for the ground check to reduce hovering.
    float groundCheckTolerance = 0.01f; 
    Vec2 groundCheckPos = { playerPosition.x, playerPosition.y - playerSize.y / 2.0f - groundCheckTolerance / 2.0f };
    Vec2 groundCheckSize = { playerSize.x * 0.9f, groundCheckTolerance };

    for (const auto& platform : platforms) {
        if (checkCollision(groundCheckPos, groundCheckSize, platform.position, platform.size)) {
            onGroundThisFrame = true;
            break;
        }
    }
    isGrounded = onGroundThisFrame;

    if (!isGrounded) {
        playerVelocity.y += gravity * deltaTime;
    } else if (playerVelocity.y < 0) {
        playerVelocity.y = 0;
    }

    playerPosition.y += playerVelocity.y * deltaTime;
    for (const auto& platform : platforms) {
        if (checkCollision(playerPosition, playerSize, platform.position, platform.size)) {
            float playerHalfY = playerSize.y / 2.0f;
            float platformHalfY = platform.size.y / 2.0f;
            float deltaY = playerPosition.y - platform.position.y;
            float penetrationY = (playerHalfY + platformHalfY) - std::abs(deltaY);

            if (deltaY > 0) {
                playerPosition.y += penetrationY;
                if (playerVelocity.y < 0) playerVelocity.y = 0;
            } else {
                playerPosition.y -= penetrationY;
                if (playerVelocity.y > 0) playerVelocity.y = 0;
            }
        }
    }
    
    playerPosition.x += playerVelocity.x * deltaTime;
    for (const auto& platform : platforms) {
        if (checkCollision(playerPosition, playerSize, platform.position, platform.size)) {
            float playerHalfX = playerSize.x / 2.0f;
            float platformHalfX = platform.size.x / 2.0f;
            float deltaX = playerPosition.x - platform.position.x;
            float penetrationX = (playerHalfX + platformHalfX) - std::abs(deltaX);
            
            if (deltaX > 0) playerPosition.x += penetrationX;
            else playerPosition.x -= penetrationX;
            
            playerVelocity.x = 0;
        }
    }
    
    std::string newState = "idle";
    if (!isGrounded) {
        newState = "jump";
    } else if (std::abs(playerVelocity.x) > 0.01f) {
        newState = "run";
    }

    if (newState != playerAnimation.currentState) {
        playerAnimation.currentState = newState;
        playerAnimation.currentFrame = 0;
        animationTimer = 0.0f;
    }

    animationTimer += deltaTime;
    float frameDuration = 0.1f;
    while (animationTimer >= frameDuration) {
        animationTimer -= frameDuration;
        playerAnimation.currentFrame = (playerAnimation.currentFrame + 1);
    }

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
Vec2 Game::getPlayerSize() const { return playerSize; }
const std::vector<Platform>& Game::getPlatforms() const { return platforms; }
Vec2 Game::getCameraPosition() const { return cameraPosition; }
AnimationState Game::getPlayerAnimationState() const { return playerAnimation; }
