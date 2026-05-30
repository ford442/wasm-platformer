#ifndef GAME_HPP
#define GAME_HPP

#include <vector>
#include <string>
#include <emscripten/val.h>
#include "Types.hpp"
#include "ParticleSystem.hpp"


class Game {
public:
    Game();
    void update(float deltaTime);
    void handleInput(const InputState& input);
    void setSoundCallback(emscripten::val callback);
    void loadLevel(const emscripten::val& level);
    void setLevelCompleteCallback(emscripten::val callback);
    Vec2 getPlayerPosition() const;
    Vec2 getPlayerSize() const;
    Vec2 getCameraPosition() const;
    const std::vector<Platform>& getPlatforms() const;
    const std::vector<Particle>& getParticles() const;
    AnimationState getPlayerAnimationState() const;

    // === Two-character (Bolts & Volts) API ===
    float getMoveSpeed() const;
    float getJumpStrength() const;
    void switchCharacter();
    int getCurrentCharacter() const; // 0 = Bolts, 1 = Volts
    void useAbility();              // Activate character-specific ability
    int getAbilityState() const;    // 0 = Ready, 1 = Active, 2 = Cooldown
    float getAbilityCooldownPercent() const; // 0.0 to 1.0

private:
    void playSound(const std::string& soundName);
    bool checkCollision(const Vec2& posA, const Vec2& sizeA, const Vec2& posB, const Vec2& sizeB);
    void updateAbility(float deltaTime);
    void applyMovementPhysics(float deltaTime, float targetVelX);

    Vec2 playerPosition;
    Vec2 playerVelocity;
    Vec2 playerSize;
    Vec2 cameraPosition;
    float cameraTargetX = 0.0f;

    AnimationState playerAnimation;
    PlayerState currentPlayerState = PlayerState::Idle;
    float animationTimer = 0.0f;
    std::vector<Platform> platforms;
    std::vector<Platform> goals;
    std::vector<bool> goalTriggered;

    bool isGrounded = false;
    bool wasGrounded = false;
    bool canJump = true;

    // Platforming feel tunables
    float coyoteTimer = 0.0f;
    float jumpBufferTimer = 0.0f;  // Input buffering for jump
    bool jumpHeld = false;
    bool jumpBuffered = false;     // Jump was pressed recently (within buffer window)

    emscripten::val soundCallback;
    emscripten::val levelCompleteCallback;
    Vec2 levelMin{ -1e6f, -1e6f };
    Vec2 levelMax{ 1e6f, 1e6f };
    bool hasLevelBounds = false;
    ParticleSystem particleSystem;

    // Two-character system
    CharacterType currentCharacter = CharacterType::Bolts;
    AbilityState abilityState = AbilityState::Ready;
    float abilityCooldownTimer = 0.0f;
    float abilityActiveTimer = 0.0f;
    bool abilityKeyWasPressed = false;  // For one-shot ability activation
    float targetMoveVelocity = 0.0f;   // Set by handleInput, applied in update with real deltaTime
};


#endif // GAME_HPP
