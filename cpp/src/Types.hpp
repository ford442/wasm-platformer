#ifndef TYPES_HPP
#define TYPES_HPP

#include <string>
#include <vector>

struct Vec2 { float x; float y; };

struct Platform { Vec2 position; Vec2 size; };

struct InputState { bool left; bool right; bool jump; };

enum class PlayerState {
    Idle,
    Run,
    Jump,
    Fall
};

struct AnimationState {
    std::string currentState;
    int currentFrame;
    bool facingLeft;
};

#endif // TYPES_HPP
