#ifndef TYPES_HPP
#define TYPES_HPP

#include <string>
#include <vector>

struct Vec2 { float x; float y; };

struct Platform { Vec2 position; Vec2 size; };

struct InputState { bool left; bool right; bool jump; bool abilityKey; };

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

// Ability state for character-specific moves
enum class AbilityState {
    Ready,       // Ability can be used
    Active,      // Ability is currently in use
    Cooldown     // Ability is on cooldown
};

struct AnimationState {
    std::string currentState;
    int currentFrame;
    bool facingLeft;
};

// Physics tuning constants (extracted for clarity and easy iteration)
namespace Physics {
    constexpr float GRAVITY = -9.8f * 2.5f;           // Base gravity
    constexpr float APEX_GRAVITY_MULT = 0.45f;        // Reduced gravity near jump apex for hang time
    constexpr float APEX_VELOCITY_THRESHOLD = 1.8f;   // Y velocity below which apex gravity kicks in
    constexpr float COYOTE_TIME = 0.12f;              // Grace period after leaving platform
    constexpr float JUMP_BUFFER_TIME = 0.10f;         // Input buffer for jump presses
    constexpr float JUMP_CUT_MULTIPLIER = 0.45f;      // Velocity cut when releasing jump early
    constexpr float GROUND_ACCEL = 18.0f;             // Horizontal acceleration on ground
    constexpr float AIR_ACCEL = 12.0f;                // Horizontal acceleration in air
    constexpr float GROUND_DECEL = 22.0f;             // Horizontal deceleration on ground
    constexpr float AIR_DECEL = 4.0f;                 // Horizontal deceleration in air (drift)
    constexpr float CAMERA_LERP_SPEED = 5.0f;        // Camera follow smoothing
    constexpr float CAMERA_LOOKAHEAD = 1.2f;          // Camera look-ahead distance in move direction
}

// Character-specific tuning
namespace CharacterStats {
    // Bolts: strong, deliberate, physical
    constexpr float BOLTS_MOVE_SPEED = 2.8f;
    constexpr float BOLTS_JUMP_STRENGTH = 6.2f;
    constexpr float BOLTS_GROUND_POUND_SPEED = -12.0f;
    constexpr float BOLTS_GROUND_POUND_COOLDOWN = 0.8f;

    // Volts: agile, tech-focused, floaty
    constexpr float VOLTS_MOVE_SPEED = 3.2f;
    constexpr float VOLTS_JUMP_STRENGTH = 7.0f;
    constexpr float VOLTS_HOVER_GRAVITY_MULT = 0.15f;
    constexpr float VOLTS_HOVER_DURATION = 1.2f;
    constexpr float VOLTS_HOVER_COOLDOWN = 2.0f;
}

#endif // TYPES_HPP
