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

// Character identity for Bolts & Volts (additive, non-breaking groundwork)
enum class CharacterType {
    Bolts = 0,   // Physical / armored / heavy lifting feel
    Volts = 1    // Tech / hologram / agile feel
};

struct AnimationState {
    std::string currentState;
    int currentFrame;
    bool facingLeft;
};

#endif // TYPES_HPP
