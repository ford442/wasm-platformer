#include "Game.hpp"
#include <cmath>
#include <algorithm>

Game::Game() {
    playerPosition = {0.0f, 0.5f};
    playerVelocity = {0.0f, 0.0f};
    playerSize = {0.1f, 0.3f};
    cameraPosition = {0.0f, 0.0f};
    playerAnimation = {"idle", 0, false};
    isGrounded = false;
    wasGrounded = false; // Initialize previous grounded state
    canJump = true;
    soundCallback = emscripten::val::null(); // Initialize callback to null


      // ground
    platforms.push_back({ {-12.25f, -2.0f}, {110.0f, 0.2f} });

    
    platforms.push_back({ {-6.25f, -1.2f}, {1.0f, 0.2f} });
    platforms.push_back({ {-4.25f, -0.8f}, {1.0f, 0.2f} });
    platforms.push_back({ {-2.25f, -0.8f}, {1.0f, 0.2f} });
    platforms.push_back({ {-2.25f, -0.8f}, {1.0f, 0.2f} });
    platforms.push_back({ {-3.0, -0.6f}, {1.0f, 0.2f} });
    platforms.push_back({ {-5.25f, -0.4f}, {1.70f, 0.2f} });

    
    platforms.push_back({ {0.0f, -0.8f}, {2.0f, 0.2f} });
    platforms.push_back({ {2.0f, -0.6f}, {1.0f, 0.2f} });
    platforms.push_back({ {4.0f, -0.4f}, {1.0f, 0.2f} });
    platforms.push_back({ {6.0f, -0.2f}, {1.5f, 0.2f} });
}

// New: Implementation for setting the callback from JS
void Game::setSoundCallback(emscripten::val callback) {
    soundCallback = callback;
}

// New: A helper to call the JavaScript function if it exists
void Game::playSound(const std::string& soundName) {
    if (!soundCallback.isNull()) {
        soundCallback(soundName);
    }
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
        playSound("jump"); // Play jump sound on successful jump
    }

    if (!input.jump) {
        canJump = true;
    }
}

void Game::update(float deltaTime) {
    wasGrounded = isGrounded; // Store the state from the previous frame

    // 1. STABLE GROUND CHECK
    isGrounded = false;
    float groundCheckDistance = 0.05f;
    Vec2 groundCheckPos = {playerPosition.x, playerPosition.y - playerSize.y / 2.0f - groundCheckDistance};
    Vec2 groundCheckSize = {playerSize.x * 0.9f, 0.1f };

    for (const auto& platform : platforms) {
        if (checkCollision(groundCheckPos, groundCheckSize, platform.position, platform.size)) {
            isGrounded = true;
            break;
        }
    }

    // Play landing sound when state changes from not-grounded to grounded
    if (isGrounded && !wasGrounded) {
        playSound("land");
    }

    // 2. APPLY FORCES
    if (!isGrounded) {
        playerVelocity.y += gravity * deltaTime;
    } else {
        playerVelocity.y = std::max(0.0f, playerVelocity.y);
    }
    
    // ... (The rest of the update function is the same)
    
    // 3. Y-AXIS MOVEMENT AND COLLISION
    playerPosition.y += playerVelocity.y * deltaTime;
    for (const auto& platform : platforms) {
        if (checkCollision(playerPosition, playerSize, platform.position, platform.size)) {
            float playerHalfY = playerSize.y / 2.0f;
            float platformHalfY = platform.size.y / 2.0f;
            float deltaY = playerPosition.y - platform.position.y;
            float penetrationY = (playerHalfY + platformHalfY) - std::abs(deltaY);

            if (deltaY > 0) { // Landing on top of a platform
                playerPosition.y += penetrationY;
                if (playerVelocity.y < 0) playerVelocity.y = 0;
            } else { // Hitting a platform from below
                playerPosition.y -= penetrationY;
                if (playerVelocity.y > 0) playerVelocity.y = 0;
            }
        }
    }
    
    // 4. X-AXIS MOVEMENT AND COLLISION
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
    
    // 5. ANIMATION
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

    // 6. CAMERA
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
