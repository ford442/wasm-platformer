#ifndef GAME_HPP
#define GAME_HPP

#include <vector>

struct Rectangle {
    float x, y, width, height;
};

struct Player {
    Rectangle rect;
    float velocityX, velocityY;
    bool onGround;
    // Animation state
    float frameTimer;
    int currentFrame;
    int facingDirection; // 0 for right, 1 for left
};

// NEW: A simple struct to represent enemies
struct Enemy {
    Rectangle rect;
    float velocityX;
    bool isDefeated;
    int facingDirection;
    // Add any other properties enemies might need
};

class Game {
public:
    Game();
    void update(bool left, bool right, bool jump);
    const std::vector<float>& getRenderData();
    const std::vector<float>& getBackgroundData();
    const std::vector<float>& getSoundData();

private:
    Player player;
    std::vector<Rectangle> platforms;
    std::vector<Enemy> enemies; // NEW: A vector to hold all enemies
    Rectangle camera;
    std::vector<float> renderData;
    std::vector<float> backgroundData;
    std::vector<float> soundData;
    void generateBackground();
};

#endif // GAME_HPP
