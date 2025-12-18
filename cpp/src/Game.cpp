#include "Game.hpp"
#include <cmath>
#include <algorithm>
#include <emscripten/val.h>
#include <cstdlib> // For rand()


Game::Game() {
    playerPosition = {0.0f, -1.5f};
    playerVelocity = {0.0f, 0.0f};
    playerSize = {0.5f, 0.8f};
    cameraPosition = {0.0f, 0.0f};
    playerAnimation = {"idle", 0, false};
    isGrounded = false;
    wasGrounded = false; // Initialize previous grounded state
    canJump = true;
    soundCallback = emscripten::val::null(); // Initialize callback to null
    levelCompleteCallback = emscripten::val::null();

    // Default ground/platforms (fallback)
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

    
    // A series of ascending platforms
    platforms.push_back({ {8.0f, 0.2f}, {1.0f, 0.2f} });
    platforms.push_back({ {10.0f, 0.6f}, {1.0f, 0.2f} });
    platforms.push_back({ {12.0f, 1.0f}, {1.0f, 0.2f} });

    // Floating platforms for a gap jump
    platforms.push_back({ {15.0f, 1.0f}, {1.5f, 0.2f} });
    platforms.push_back({ {18.0f, 1.5f}, {1.0f, 0.2f} });

    // A higher platform to test a vertical jump
    platforms.push_back({ {20.0f, 2.5f}, {2.0f, 0.2f} });

    // A long descending ramp
    platforms.push_back({ {23.0f, 1.5f}, {2.0f, 0.2f} });
    platforms.push_back({ {26.0f, 0.5f}, {2.0f, 0.2f} });
    platforms.push_back({ {29.0f, -0.5f}, {3.0f, 0.2f} });

    // Platforms with varied sizes and positions
    platforms.push_back({ {33.0f, -0.2f}, {1.0f, 0.5f} });
    platforms.push_back({ {35.0f, 0.8f}, {2.5f, 0.2f} });
    platforms.push_back({ {38.0f, 1.5f}, {1.0f, 0.2f} });

    // A large, high platform
    platforms.push_back({ {42.0f, 2.0f}, {4.0f, 0.3f} });

    // Maze-like section with vertical challenges (46-60)
    platforms.push_back({ {46.0f, 1.2f}, {1.5f, 0.2f} });
    platforms.push_back({ {48.5f, 0.4f}, {1.0f, 0.2f} });
    platforms.push_back({ {50.5f, 1.0f}, {1.5f, 0.2f} });
    platforms.push_back({ {52.5f, 2.0f}, {1.0f, 0.2f} });
    platforms.push_back({ {54.0f, 2.8f}, {2.0f, 0.2f} });
    platforms.push_back({ {56.5f, 2.0f}, {1.0f, 0.2f} });
    platforms.push_back({ {58.0f, 1.2f}, {1.5f, 0.2f} });
    platforms.push_back({ {60.0f, 0.5f}, {1.5f, 0.2f} });

    // Precision jumping section with small platforms (62-75)
    platforms.push_back({ {62.5f, 1.0f}, {0.8f, 0.2f} });
    platforms.push_back({ {64.0f, 1.5f}, {0.8f, 0.2f} });
    platforms.push_back({ {65.5f, 2.0f}, {0.8f, 0.2f} });
    platforms.push_back({ {67.0f, 2.3f}, {0.8f, 0.2f} });
    platforms.push_back({ {68.5f, 2.5f}, {1.0f, 0.2f} });
    platforms.push_back({ {70.5f, 2.0f}, {0.8f, 0.2f} });
    platforms.push_back({ {72.0f, 1.5f}, {0.8f, 0.2f} });
    platforms.push_back({ {73.5f, 1.0f}, {1.0f, 0.2f} });
    platforms.push_back({ {75.0f, 0.3f}, {1.5f, 0.2f} });

    // Final challenge section - zigzag pattern (77-90)
    platforms.push_back({ {77.5f, 0.8f}, {1.5f, 0.2f} });
    platforms.push_back({ {79.5f, 1.6f}, {1.5f, 0.2f} });
    platforms.push_back({ {81.5f, 2.4f}, {1.5f, 0.2f} });
    platforms.push_back({ {83.5f, 3.0f}, {2.0f, 0.2f} });
    platforms.push_back({ {86.0f, 2.2f}, {1.5f, 0.2f} });
    platforms.push_back({ {88.0f, 1.4f}, {1.5f, 0.2f} });
    platforms.push_back({ {90.0f, 0.6f}, {2.0f, 0.2f} });

    // Goal platform - elevated finish line
    platforms.push_back({ {93.0f, 1.5f}, {3.0f, 0.5f} });
}

    // Vertical climb section
    platforms.push_back({ {46.0f, 2.0f}, {2.0f, 0.2f} });
    platforms.push_back({ {47.5f, 3.0f}, {1.5f, 0.2f} });
    platforms.push_back({ {46.0f, 4.0f}, {1.5f, 0.2f} });
    platforms.push_back({ {47.5f, 5.0f}, {1.5f, 0.2f} });

    // Long jumps
    platforms.push_back({ {49.5f, 5.5f}, {1.5f, 0.2f} });
    platforms.push_back({ {52.0f, 6.0f}, {2.0f, 0.2f} });

    // Final high platform
    platforms.push_back({ {55.0f, 7.0f}, {2.0f, 0.2f} });
}

void Game::setSoundCallback(emscripten::val callback) {
    soundCallback = callback;
}

void Game::setLevelCompleteCallback(emscripten::val callback) {
    levelCompleteCallback = callback;
}

void Game::playSound(const std::string& soundName) {
    if (!soundCallback.isNull()) {
        soundCallback(soundName);
    }
}

void Game::loadLevel(const emscripten::val& level) {
    // Expecting an object like: { spawn: {x,y}, platforms: [{position:{x,y}, size:{x,y}}, ...], bounds: {min:{x,y}, max:{x,y}}, goals: [...] }
    if (level.isNull() || level.isUndefined()) return;
    platforms.clear();
    goals.clear();
    goalTriggered.clear();
    hasLevelBounds = false;

    // spawn
    if (level.hasOwnProperty("spawn")) {
        emscripten::val spawn = level["spawn"];
        if (!spawn.isNull() && !spawn.isUndefined() && spawn.hasOwnProperty("x") && spawn.hasOwnProperty("y")) {
            playerPosition.x = spawn["x"].as<float>();
            playerPosition.y = spawn["y"].as<float>();
            playerVelocity = {0.0f, 0.0f};
        }
    }

    // platforms
    if (level.hasOwnProperty("platforms")) {
        emscripten::val jsPlatforms = level["platforms"];
        const unsigned length = jsPlatforms["length"].as<unsigned>();
        for (unsigned i = 0; i < length; ++i) {
            emscripten::val jsPlatform = jsPlatforms[i];
            if (jsPlatform.hasOwnProperty("position") && jsPlatform.hasOwnProperty("size")) {
                emscripten::val jsPosition = jsPlatform["position"];
                emscripten::val jsSize = jsPlatform["size"];
                if (jsPosition.hasOwnProperty("x") && jsPosition.hasOwnProperty("y") &&
                    jsSize.hasOwnProperty("x") && jsSize.hasOwnProperty("y")) {
                    Vec2 position = { jsPosition["x"].as<float>(), jsPosition["y"].as<float>() };
                    Vec2 size = { jsSize["x"].as<float>(), jsSize["y"].as<float>() };
                    platforms.push_back({ position, size });
                }
            }
        }
    }

    // goals (optional)
    if (level.hasOwnProperty("goals")) {
        emscripten::val jsGoals = level["goals"];
        const unsigned gLen = jsGoals["length"].as<unsigned>();
        for (unsigned i = 0; i < gLen; ++i) {
            emscripten::val jsGoal = jsGoals[i];
            if (jsGoal.hasOwnProperty("position") && jsGoal.hasOwnProperty("size")) {
                emscripten::val jsPosition = jsGoal["position"];
                emscripten::val jsSize = jsGoal["size"];
                if (jsPosition.hasOwnProperty("x") && jsPosition.hasOwnProperty("y") &&
                    jsSize.hasOwnProperty("x") && jsSize.hasOwnProperty("y")) {
                    Vec2 position = { jsPosition["x"].as<float>(), jsPosition["y"].as<float>() };
                    Vec2 size = { jsSize["x"].as<float>(), jsSize["y"].as<float>() };
                    goals.push_back({ position, size });
                    goalTriggered.push_back(false);
                }
            }
        }
    }

    // Optionally handle camera bounds if provided
    if (level.hasOwnProperty("bounds")) {
        emscripten::val bounds = level["bounds"];
        if (bounds.hasOwnProperty("min") && bounds.hasOwnProperty("max")) {
            emscripten::val min = bounds["min"];
            emscripten::val max = bounds["max"];
            if (min.hasOwnProperty("x") && min.hasOwnProperty("y") &&
                max.hasOwnProperty("x") && max.hasOwnProperty("y")) {
                levelMin = { min["x"].as<float>(), min["y"].as<float>() };
                levelMax = { max["x"].as<float>(), max["y"].as<float>() };
                hasLevelBounds = true;
            }
        }
    }
    // Set camera to player on load
    cameraPosition.x = playerPosition.x;
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

    // Jump logic
    if (input.jump && isGrounded && canJump) {
        playerVelocity.y = jumpStrength;
        isGrounded = false;
        canJump = false;
        currentPlayerState = PlayerState::Jump;
        playSound("jump");
        
        // Emit jump particles
        for (int i = 0; i < 10; ++i) {
            float angle = (rand() % 100 / 100.0f) * 3.14159f;
            float speed = 1.0f + (rand() % 100 / 100.0f) * 2.0f;
            Vec2 vel = { std::cos(angle) * speed * 0.5f, std::sin(angle) * speed * 0.5f };
            Vec2 pos = { playerPosition.x, playerPosition.y - playerSize.y / 2.0f };
            particleSystem.emit(pos, vel, 0.5f, 0.1f, (rand() % 100 - 50) * 0.1f);
        }
    }
    if (!input.jump) {
        canJump = true;
    }
}


void Game::update(float deltaTime) {
    particleSystem.update(deltaTime);

    wasGrounded = isGrounded; // Store the state from the previous frame
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
    if (isGrounded && !wasGrounded) {
        playSound("land");
        // Emit land particles
        for (int i = 0; i < 10; ++i) {
            float angle = (rand() % 100 / 100.0f) * 3.14159f; // 0 to PI
            float speed = 1.0f + (rand() % 100 / 100.0f) * 2.0f;
            Vec2 vel = { std::cos(angle) * speed, std::abs(std::sin(angle) * speed * 0.5f) }; 
            Vec2 pos = { playerPosition.x, playerPosition.y - playerSize.y / 2.0f };
            particleSystem.emit(pos, vel, 0.3f, 0.08f, (rand() % 100 - 50) * 0.1f);
        }
    }
    if (!isGrounded) {
        playerVelocity.y += gravity * deltaTime;
    } else {
        playerVelocity.y = std::max(0.0f, playerVelocity.y);
    }
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
    // State Machine Update
    if (!isGrounded) {
        if (playerVelocity.y > 0) currentPlayerState = PlayerState::Jump;
        else currentPlayerState = PlayerState::Fall; // We can map Fall to Jump animation or a new one
    } else if (std::abs(playerVelocity.x) > 0.01f) {
        currentPlayerState = PlayerState::Run;
        // Emit run particles occasionally
        if ((rand() % 100) < 10) { 
             Vec2 vel = { -playerVelocity.x * 0.5f, 0.5f + (rand() % 100 / 100.0f) };
             Vec2 pos = { playerPosition.x, playerPosition.y - playerSize.y / 2.0f };
             particleSystem.emit(pos, vel, 0.2f, 0.05f, (rand() % 100 - 50) * 0.1f);
        }
    } else {
        currentPlayerState = PlayerState::Idle;
    }

    // Map State to String for JS
    std::string newStateString = "idle";
    switch (currentPlayerState) {
        case PlayerState::Idle: newStateString = "idle"; break;
        case PlayerState::Run: newStateString = "run"; break;
        case PlayerState::Jump: newStateString = "jump"; break;
        case PlayerState::Fall: newStateString = "jump"; break; // Re-use jump for now
    }

    if (newStateString != playerAnimation.currentState) {
        playerAnimation.currentState = newStateString;
        playerAnimation.currentFrame = 0;
        animationTimer = 0.0f;
    }
    animationTimer += deltaTime;
    float frameDuration = 0.25f;
    while (animationTimer >= frameDuration) {
        animationTimer -= frameDuration;
        playerAnimation.currentFrame = (playerAnimation.currentFrame + 1);
    }
    cameraPosition.x = playerPosition.x;
    // clamp camera to level bounds if provided
    if (hasLevelBounds) {
        if (cameraPosition.x < levelMin.x) cameraPosition.x = levelMin.x;
        if (cameraPosition.x > levelMax.x) cameraPosition.x = levelMax.x;
    }

    // check goals for completion
    for (size_t i = 0; i < goals.size(); ++i) {
        if (goalTriggered[i]) continue;
        if (checkCollision(playerPosition, playerSize, goals[i].position, goals[i].size)) {
            goalTriggered[i] = true;
            if (!levelCompleteCallback.isNull()) {
                levelCompleteCallback();
            }
        }
    }
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

const std::vector<Particle>& Game::getParticles() const { return particleSystem.getParticles(); }
