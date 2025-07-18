#ifndef GAME_HPP
#define GAME_HPP

// A simple struct to hold 2D vector data for position and velocity.
struct Vec2 {
    float x;
    float y;
};

// This struct will hold the state of the player's inputs.
// We'll pass this object from TypeScript to C++ every frame.
struct InputState {
    bool left;
    bool right;
    bool jump;
};

class Game {
public:
    Game();
    void update(float deltaTime);
    
    // New method to handle input
    void handleInput(const InputState& input);

    Vec2 getPlayerPosition() const;

private:
    Vec2 playerPosition;
    Vec2 playerVelocity;
    
    // Physics constants
    const float gravity = -9.8f * 2.0f; // A little extra gravity
    const float moveSpeed = 5.0f;
    const float jumpStrength = 8.0f;
    bool isGrounded = false;
};

#endif // GAME_HPP
