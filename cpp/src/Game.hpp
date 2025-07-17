#ifndef GAME_HPP
#define GAME_HPP

// A simple struct to hold 2D position data.
struct Position {
    float x;
    float y;
};

class Game {
public:
    // Constructor: Initializes the game state.
    Game();

    // The main update function, called on every frame.
    // 'deltaTime' is the time in seconds since the last frame.
    void update(float deltaTime);

    // Getter for the player's current position.
    Position getPlayerPosition() const;

private:
    Position playerPosition;
    float time; // To create some simple movement
};

#endif // GAME_HPP
