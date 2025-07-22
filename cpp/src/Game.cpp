#include "Game.hpp" // This line is crucial and fixes the error.
#include <cmath>
#include <algorithm>

// The constructor initializes the game state.
Game::Game() {
    playerPosition = {0.0f, 0.5f};
    playerVelocity = {0.0f, 0.0f};
    playerSize = {0.5f, 0.5f};
    cameraPosition = {0.0f, 0.0f};
    playerAnimation = {"idle", 0, false};

    // Defines the initial layout of the platforms.
    platforms.push_back({ {0.0f, -0.8f}, {2.0f, 0.2f} });
    platforms.push_back({ {2.0f, -0.6f}, {1.0f, 0.2f} });
    platforms.push_back({ {4.0f, -0.4f}, {1.0f, 0.2f} });
    platforms.push_back({ {6.0f, -0.2f}, {1.5f, 0.2f} });
}

// Handles player input to change velocity and animation state.
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

// The main game loop update function with stable physics.
void Game::update(float deltaTime) {
    // Apply gravity if the player is not on the ground.
    if (!isGrounded) {
        playerVelocity.y += gravity * deltaTime;
    }

    // --- Move on Y Axis First ---
    // This ensures landing is prioritized over side collisions.
    playerPosition.y += playerVelocity.y * deltaTime;
    isGrounded = false; 
    for (const auto& platform : platforms) {
        if (checkCollision(playerPosition, playerSize, platform.position, platform.size)) {
            float playerHalfY = playerSize.y / 2.0f;
            float platformHalfY = platform.size.y / 2.0f;
            float deltaY = playerPosition.y - platform.position.y;
            float penetrationY = (playerHalfY + platformHalfY) - std::abs(deltaY);

            if (deltaY > 0) { // Player is landing from above.
                playerPosition.y += penetrationY;
                if (playerVelocity.y < 0) playerVelocity.y = 0;
                isGrounded = true; 
            } else { // Player is hitting their head from below.
                playerPosition.y -= penetrationY;
                if (playerVelocity.y > 0) playerVelocity.y = 0;
            }
        }
    }
    
    // --- Move on X Axis ---
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
    
    // --- Animation Logic ---
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

    // --- Update Camera ---
    cameraPosition.x = playerPosition.x;
}

// Standard Axis-Aligned Bounding Box (AABB) collision check.
bool Game::checkCollision(const Vec2& posA, const Vec2& sizeA, const Vec2& posB, const Vec2& sizeB) {
    bool collisionX = (posA.x - sizeA.x / 2.0f < posB.x + sizeB.x / 2.0f) &&
                      (posA.x + sizeA.x / 2.0f > posB.x - sizeB.x / 2.0f);
    bool collisionY = (posA.y - sizeA.y / 2.0f < posB.y + sizeB.y / 2.0f) &&
                      (posA.y + sizeA.y / 2.0f > posB.y - sizeB.y / 2.0f);
    return collisionX && collisionY;
}

// --- Getter Functions ---
// These functions provide read-only access to the game's state.
Vec2 Game::getPlayerPosition() const { return playerPosition; }
Vec2 Game::getPlayerSize() const { return playerSize; }
const std::vector<Platform>& Game::getPlatforms() const { return platforms; }
Vec2 Game::getCameraPosition() const { return cameraPosition; }
AnimationState Game::getPlayerAnimationState() const { return playerAnimation; }
