#ifndef GAME_HPP
#define GAME_HPP

#include <vector>
#include <string>
#include <emscripten/val.h> // Required for emscripten::val

struct Vec2 { float x; float y; };
struct Platform { Vec2 position; Vec2 size; };
struct InputState { bool left; bool right; bool jump; };
struct AnimationState {
    std::string currentState;
    int currentFrame;
    bool facingLeft;
};
struct Enemy {
    Box box;
    float vx;
};

// NEW: Define a struct for a scenery item
struct Scenery {
    Box box;
    int type; // e.g., 0 for flower, 1 for bush
};

// NEW: Define a struct for a door
struct Door {
    Box box;
    std::string leads_to; // The name of the map this door leads to
};
class Game {
public:
    Game(int width, int height);

    void loadLevel(const std::string& levelData);
    void update(const std::string& input, float dt);
    const GameState& getGameState() const;
    const Player& getPlayer() const;
    const std::vector<Box>& getPlatforms() const;
    
    // NEW: Add getters for our new entities
    const std::vector<Enemy>& getEnemies() const;
    const std::vector<Scenery>& getScenery() const;
    const std::vector<Door>& getDoors() const;


private:
    void resolvePlatformCollisions(Player& player, const Box& platform);

    int screenWidth;
    int screenHeight;
    Player player;
    std::vector<Box> platforms;

    // NEW: Add vectors to store the new entities
    std::vector<Enemy> enemies;
    std::vector<Scenery> scenery;
    std::vector<Door> doors;

    GameState gameState;
};

#endif // GAME_HPP
