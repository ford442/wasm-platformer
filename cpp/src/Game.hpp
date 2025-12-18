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
    void setLevelCompleteCallback(emscripten::val callback); // New: set a JS callback that's invoked when a level goal is reached
    Vec2 getPlayerPosition() const;
    Vec2 getPlayerSize() const;
    Vec2 getCameraPosition() const;
    const std::vector<Platform>& getPlatforms() const;
    const std::vector<Particle>& getParticles() const;
    AnimationState getPlayerAnimationState() const;
private:
    void playSound(const std::string& soundName);
    bool checkCollision(const Vec2& posA, const Vec2& sizeA, const Vec2& posB, const Vec2& sizeB);
    Vec2 playerPosition;
    Vec2 playerVelocity;
    Vec2 playerSize;
    Vec2 cameraPosition;

    AnimationState playerAnimation;
    PlayerState currentPlayerState = PlayerState::Idle;
    float animationTimer = 0.0f;
    std::vector<Platform> platforms;
    std::vector<Platform> goals; // Goals are similar to platforms but trigger level completion when touched
    std::vector<bool> goalTriggered;
    const float gravity = -9.8f * 2.5f;
    const float moveSpeed = 2.0f;
    const float jumpStrength = 6.0f;
    bool isGrounded = false;
    bool wasGrounded = false; // New: To track state changes for landing sound
    bool canJump = true;
    emscripten::val soundCallback;
    emscripten::val levelCompleteCallback;
    Vec2 levelMin{ -1e6f, -1e6f };
    Vec2 levelMax{ 1e6f, 1e6f };
    bool hasLevelBounds = false;
    ParticleSystem particleSystem;
};


#endif // GAME_HPP
