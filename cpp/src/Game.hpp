#ifndef GAME_HPP
#define GAME_HPP

#include <vector>
#include <string>

struct Vec2 { float x; float y; };
struct Platform { Vec2 position; Vec2 size; };
struct InputState { bool left; bool right; bool jump; };
struct AnimationState {
    std::string currentState;
    int currentFrame;
    bool facingLeft;
};

class Game {
public:
    Game();
    void update(float deltaTime);
    void handleInput(const InputState& input);

    Vec2 getPlayerPosition() const;
    Vec2 getCameraPosition() const;
    const std::vector<Platform>& getPlatforms() const;
    AnimationState getPlayerAnimationState() const;

private:
    bool checkCollision(const Vec2& posA, const Vec2& sizeA, const Vec2& posB, const Vec2& sizeB);

    Vec2 playerPosition;
    Vec2 playerVelocity;
    Vec2 playerSize;
    Vec2 cameraPosition;
    
    AnimationState playerAnimation;
    float animationTimer = 0.0f;

    std::vector<Platform> platforms;

    const float gravity = -9.8f * 2.5f;
    const float moveSpeed = 2.0f;
    const float jumpStrength = 6.0f;
    bool isGrounded = false;
    bool canJump = true;
};

#endif // GAME_HPP
