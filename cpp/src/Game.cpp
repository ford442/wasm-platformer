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
    cameraTargetX = 0.0f;
    playerAnimation = {"idle", 0, false};
    isGrounded = false;
    wasGrounded = false;
    canJump = true;
    coyoteTimer = 0.0f;
    jumpBufferTimer = 0.0f;
    jumpHeld = false;
    jumpBuffered = false;
    soundCallback = emscripten::val::null();
    levelCompleteCallback = emscripten::val::null();

    // Default ground/platforms (fallback if no level JSON loaded)
    platforms.push_back({ {-12.25f, -2.0f}, {110.0f, 0.2f} });
    platforms.push_back({ {0.0f, -0.8f}, {2.0f, 0.2f} });
    platforms.push_back({ {2.0f, -0.6f}, {1.0f, 0.2f} });
    platforms.push_back({ {4.0f, -0.4f}, {1.0f, 0.2f} });
    platforms.push_back({ {6.0f, -0.2f}, {1.5f, 0.2f} });
    platforms.push_back({ {8.0f, 0.2f}, {1.0f, 0.2f} });
    platforms.push_back({ {10.0f, 0.6f}, {1.0f, 0.2f} });
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
    if (level.isNull() || level.isUndefined()) return;
    platforms.clear();
    goals.clear();
    goalTriggered.clear();
    hasLevelBounds = false;

    // Reset ability state on level load
    abilityState = AbilityState::Ready;
    abilityCooldownTimer = 0.0f;
    abilityActiveTimer = 0.0f;

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

    // Camera bounds
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
    // Set camera to player on load (instant, no lerp)
    cameraPosition.x = playerPosition.x;
    cameraTargetX = playerPosition.x;
}


void Game::applyMovementPhysics(float deltaTime, float targetVelX) {
    const float maxSpeed = getMoveSpeed();
    const float accel = isGrounded ? Physics::GROUND_ACCEL : Physics::AIR_ACCEL;
    const float decel = isGrounded ? Physics::GROUND_DECEL : Physics::AIR_DECEL;

    if (std::abs(targetVelX) > 0.01f) {
        // Accelerate toward target
        float diff = targetVelX - playerVelocity.x;
        float change = accel * deltaTime;
        if (std::abs(diff) < change) {
            playerVelocity.x = targetVelX;
        } else {
            playerVelocity.x += (diff > 0 ? change : -change);
        }
        // Clamp to max speed
        playerVelocity.x = std::max(-maxSpeed, std::min(maxSpeed, playerVelocity.x));
    } else {
        // Decelerate to stop
        float change = decel * deltaTime;
        if (std::abs(playerVelocity.x) < change) {
            playerVelocity.x = 0.0f;
        } else {
            playerVelocity.x -= (playerVelocity.x > 0 ? change : -change);
        }
    }
}


void Game::handleInput(const InputState& input) {
    const float currentMoveSpeed = getMoveSpeed();
    float targetVelX = 0.0f;

    if (input.left) {
        targetVelX = -currentMoveSpeed;
        playerAnimation.facingLeft = true;
    } else if (input.right) {
        targetVelX = currentMoveSpeed;
        playerAnimation.facingLeft = false;
    }

    // Apply acceleration-based movement
    applyMovementPhysics(0.016f, targetVelX); // Use fixed step for input response consistency

    // Jump input buffering: if jump is pressed, buffer it for a short window
    if (input.jump && !jumpHeld) {
        jumpBuffered = true;
        jumpBufferTimer = Physics::JUMP_BUFFER_TIME;
    }

    // Jump logic (with coyote time + jump buffer + variable height via cut on release)
    const bool canCoyoteJump = (isGrounded || coyoteTimer > 0.0f);
    if (jumpBuffered && canCoyoteJump && canJump) {
        playerVelocity.y = getJumpStrength();
        isGrounded = false;
        canJump = false;
        coyoteTimer = 0.0f;
        jumpBuffered = false;
        jumpBufferTimer = 0.0f;
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

    // Track jump button state for variable jump height (cut on release)
    if (input.jump) {
        jumpHeld = true;
    } else {
        if (jumpHeld && playerVelocity.y > 0.0f) {
            // Player released jump while still rising → shorter hop
            playerVelocity.y *= Physics::JUMP_CUT_MULTIPLIER;
        }
        jumpHeld = false;
        canJump = true;
    }

    // Ability activation (one-shot on press)
    if (input.abilityKey && !abilityKeyWasPressed) {
        useAbility();
    }
    abilityKeyWasPressed = input.abilityKey;
}


void Game::updateAbility(float deltaTime) {
    switch (abilityState) {
        case AbilityState::Active:
            abilityActiveTimer -= deltaTime;
            if (abilityActiveTimer <= 0.0f) {
                abilityState = AbilityState::Cooldown;
                float cooldown = (currentCharacter == CharacterType::Bolts)
                    ? CharacterStats::BOLTS_GROUND_POUND_COOLDOWN
                    : CharacterStats::VOLTS_HOVER_COOLDOWN;
                abilityCooldownTimer = cooldown;
            }
            break;
        case AbilityState::Cooldown:
            abilityCooldownTimer -= deltaTime;
            if (abilityCooldownTimer <= 0.0f) {
                abilityState = AbilityState::Ready;
                abilityCooldownTimer = 0.0f;
            }
            break;
        case AbilityState::Ready:
            break;
    }
}


void Game::useAbility() {
    if (abilityState != AbilityState::Ready) return;

    if (currentCharacter == CharacterType::Bolts) {
        // Ground Pound: slam downward quickly when airborne
        if (!isGrounded) {
            playerVelocity.y = CharacterStats::BOLTS_GROUND_POUND_SPEED;
            playerVelocity.x *= 0.2f; // Kill most horizontal momentum
            abilityState = AbilityState::Active;
            abilityActiveTimer = 0.4f; // Short active duration (will end on landing too)
            playSound("ground_pound");

            // Slam particles
            for (int i = 0; i < 8; ++i) {
                float angle = (rand() % 100 / 100.0f) * 6.28f;
                float spd = 1.5f + (rand() % 100 / 100.0f) * 1.5f;
                Vec2 vel = { std::cos(angle) * spd * 0.3f, -std::abs(std::sin(angle) * spd) };
                Vec2 pos = { playerPosition.x, playerPosition.y - playerSize.y * 0.4f };
                particleSystem.emit(pos, vel, 0.4f, 0.12f, (rand() % 100 - 50) * 0.15f);
            }
        }
    } else {
        // Volts Hover: reduce gravity significantly for a duration while airborne
        if (!isGrounded) {
            abilityState = AbilityState::Active;
            abilityActiveTimer = CharacterStats::VOLTS_HOVER_DURATION;
            // Reduce downward velocity to start hover
            if (playerVelocity.y < 0.0f) {
                playerVelocity.y *= 0.3f;
            }
            playSound("hover");

            // Tech particles
            for (int i = 0; i < 6; ++i) {
                float angle = (rand() % 100 / 100.0f) * 6.28f;
                float spd = 0.5f + (rand() % 100 / 100.0f) * 0.8f;
                Vec2 vel = { std::cos(angle) * spd, std::sin(angle) * spd * 0.4f - 0.5f };
                Vec2 pos = { playerPosition.x, playerPosition.y - playerSize.y * 0.5f };
                particleSystem.emit(pos, vel, 0.6f, 0.06f, (rand() % 100 - 50) * 0.2f);
            }
        }
    }
}


void Game::update(float deltaTime) {
    // Safety clamp: prevent tunneling on lag/tab-switch
    if (deltaTime > 0.033f) deltaTime = 0.033f;

    particleSystem.update(deltaTime);
    updateAbility(deltaTime);

    // Decay jump buffer
    if (jumpBufferTimer > 0.0f) {
        jumpBufferTimer -= deltaTime;
        if (jumpBufferTimer <= 0.0f) {
            jumpBuffered = false;
        }
    }

    wasGrounded = isGrounded;
    isGrounded = false;
    float groundCheckDistance = 0.05f;
    Vec2 groundCheckPos = {playerPosition.x, playerPosition.y - playerSize.y / 2.0f - groundCheckDistance};
    Vec2 groundCheckSize = {playerSize.x * 0.9f, 0.1f};
    for (const auto& platform : platforms) {
        if (checkCollision(groundCheckPos, groundCheckSize, platform.position, platform.size)) {
            isGrounded = true;
            break;
        }
    }

    if (isGrounded && !wasGrounded) {
        playSound("land");
        // End ground pound active state on landing
        if (abilityState == AbilityState::Active && currentCharacter == CharacterType::Bolts) {
            abilityState = AbilityState::Cooldown;
            abilityCooldownTimer = CharacterStats::BOLTS_GROUND_POUND_COOLDOWN;
            // Impact particles on ground pound landing
            for (int i = 0; i < 14; ++i) {
                float angle = (rand() % 100 / 100.0f) * 3.14159f;
                float speed = 2.0f + (rand() % 100 / 100.0f) * 3.0f;
                Vec2 vel = { std::cos(angle) * speed, std::abs(std::sin(angle) * speed * 0.7f) };
                Vec2 pos = { playerPosition.x, playerPosition.y - playerSize.y / 2.0f };
                particleSystem.emit(pos, vel, 0.5f, 0.12f, (rand() % 100 - 50) * 0.12f);
            }
        }
        // Normal land particles
        for (int i = 0; i < 10; ++i) {
            float angle = (rand() % 100 / 100.0f) * 3.14159f;
            float speed = 1.0f + (rand() % 100 / 100.0f) * 2.0f;
            Vec2 vel = { std::cos(angle) * speed, std::abs(std::sin(angle) * speed * 0.5f) };
            Vec2 pos = { playerPosition.x, playerPosition.y - playerSize.y / 2.0f };
            particleSystem.emit(pos, vel, 0.3f, 0.08f, (rand() % 100 - 50) * 0.1f);
        }
        coyoteTimer = Physics::COYOTE_TIME;
    } else if (!isGrounded) {
        if (coyoteTimer > 0.0f) {
            coyoteTimer -= deltaTime;
        }
        // Cancel hover ability on landing (Volts)
    } else {
        coyoteTimer = Physics::COYOTE_TIME;
        // End hover if grounded
        if (abilityState == AbilityState::Active && currentCharacter == CharacterType::Volts) {
            abilityState = AbilityState::Cooldown;
            abilityCooldownTimer = CharacterStats::VOLTS_HOVER_COOLDOWN;
        }
    }

    // Gravity with apex hang time and ability modifications
    if (!isGrounded) {
        float gravityMult = 1.0f;

        // Apex hang time: reduce gravity when near the peak of a jump
        if (std::abs(playerVelocity.y) < Physics::APEX_VELOCITY_THRESHOLD) {
            gravityMult = Physics::APEX_GRAVITY_MULT;
        }

        // Volts hover: dramatically reduce gravity while ability is active
        if (currentCharacter == CharacterType::Volts && abilityState == AbilityState::Active) {
            gravityMult = CharacterStats::VOLTS_HOVER_GRAVITY_MULT;
            // Emit subtle hover particles
            if ((rand() % 100) < 15) {
                float angle = (rand() % 100 / 100.0f) * 6.28f;
                Vec2 vel = { std::cos(angle) * 0.3f, -0.5f };
                Vec2 pos = { playerPosition.x + (rand() % 100 - 50) * 0.003f, playerPosition.y - playerSize.y * 0.5f };
                particleSystem.emit(pos, vel, 0.3f, 0.04f, (rand() % 100 - 50) * 0.1f);
            }
        }

        playerVelocity.y += Physics::GRAVITY * gravityMult * deltaTime;
    } else {
        playerVelocity.y = std::max(0.0f, playerVelocity.y);
    }

    // Vertical movement + collision
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

    // Horizontal movement + collision
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
        else currentPlayerState = PlayerState::Fall;
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
        case PlayerState::Fall: newStateString = "jump"; break; // Re-use jump animation for now
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

    // Smooth camera follow with look-ahead
    float lookahead = 0.0f;
    if (std::abs(playerVelocity.x) > 0.5f) {
        lookahead = (playerVelocity.x > 0 ? 1.0f : -1.0f) * Physics::CAMERA_LOOKAHEAD;
    }
    cameraTargetX = playerPosition.x + lookahead;
    cameraPosition.x += (cameraTargetX - cameraPosition.x) * Physics::CAMERA_LERP_SPEED * deltaTime;

    // Clamp camera to level bounds
    if (hasLevelBounds) {
        if (cameraPosition.x < levelMin.x) cameraPosition.x = levelMin.x;
        if (cameraPosition.x > levelMax.x) cameraPosition.x = levelMax.x;
    }

    // Check goals for completion
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

// === Bolts & Volts character system ===

float Game::getMoveSpeed() const {
    return (currentCharacter == CharacterType::Bolts)
        ? CharacterStats::BOLTS_MOVE_SPEED
        : CharacterStats::VOLTS_MOVE_SPEED;
}

float Game::getJumpStrength() const {
    return (currentCharacter == CharacterType::Bolts)
        ? CharacterStats::BOLTS_JUMP_STRENGTH
        : CharacterStats::VOLTS_JUMP_STRENGTH;
}

void Game::switchCharacter() {
    currentCharacter = (currentCharacter == CharacterType::Bolts)
        ? CharacterType::Volts
        : CharacterType::Bolts;

    // Reset ability state on switch
    abilityState = AbilityState::Ready;
    abilityCooldownTimer = 0.0f;
    abilityActiveTimer = 0.0f;

    // Feedback: particle puff + dampen velocity
    playerVelocity.x *= 0.3f;
    for (int i = 0; i < 6; ++i) {
        float angle = (rand() % 100 / 100.0f) * 6.28f;
        float spd = 0.8f + (rand() % 100 / 100.0f) * 1.2f;
        Vec2 vel = { std::cos(angle) * spd, std::sin(angle) * spd * 0.6f };
        Vec2 pos = { playerPosition.x, playerPosition.y - playerSize.y * 0.3f };
        particleSystem.emit(pos, vel, 0.35f, 0.07f, (rand() % 100 - 50) * 0.08f);
    }
    playSound("switch");
}

int Game::getCurrentCharacter() const {
    return static_cast<int>(currentCharacter);
}

int Game::getAbilityState() const {
    return static_cast<int>(abilityState);
}

float Game::getAbilityCooldownPercent() const {
    if (abilityState == AbilityState::Cooldown) {
        float maxCooldown = (currentCharacter == CharacterType::Bolts)
            ? CharacterStats::BOLTS_GROUND_POUND_COOLDOWN
            : CharacterStats::VOLTS_HOVER_COOLDOWN;
        return (maxCooldown > 0.0f) ? (abilityCooldownTimer / maxCooldown) : 0.0f;
    }
    if (abilityState == AbilityState::Active) return 1.0f;
    return 0.0f;
}
