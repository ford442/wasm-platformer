#ifndef GAME_HPP
#define GAME_HPP

#include <vector> // We need to include the vector library

// A simple struct to hold 2D vector data for position and velocity.
struct Vec2 {
    float x;
    float y;
};

// A struct to represent a rectangular platform.
// It has a position (center point) and a size (width, height).
struct Platform {
    Vec2 position;
    Vec2 size;
};

// This struct will hold the state of the player's inputs.
struct InputState {
    bool left;
    bool right;
    bool jump;
};

class Game {
public:
    Game();
    void update(float deltaTime);
    void handleInput(const InputState& input);

    Vec2 getPlayerPosition() const;
    // New getter to send platform data to the frontend for rendering
    const std::vector<Platform>& getPlatforms() const;

private:
    // Helper function for collision detection
    bool checkCollision(const Vec2& posA, const Vec2& sizeA, const Vec2& posB, const Vec2& sizeB);

    Vec2 playerPosition;
    Vec2 playerVelocity;
    Vec2 playerSize; // Give the player a size for collision checks

    std::vector<Platform> platforms; // A list to hold all our platforms

    // Physics constants
    const float gravity = -9.8f * 2.5f;
    const float moveSpeed = 2.0f;
    const float jumpStrength = 6.0f;
    bool isGrounded = false;
};

#endif // GAME_HPP
