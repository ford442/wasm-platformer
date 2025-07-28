#pragma once

#include <string>
#include <vector>

// ## Data Structures ##
// Define all data structures first, so the compiler knows what they are.

// Basic building block for all game objects
struct Box {
    float x, y, w, h;
};

// Player-specific data
struct Player {
    Box box;
    float vx, vy;
    bool on_ground;
};

// Enemy data
struct Enemy {
    Box box;
    float vx; // Horizontal velocity
};

// Scenery data (static decorations)
struct Scenery {
    Box box;
    int type; // e.g., 0 for flower, 1 for bush
};

// Door data for level transitions
struct Door {
    Box box;
    std::string leads_to; // Name of the map file to load
};

// Game state flags, including level transition signal
struct GameState {
    bool is_paused = false;
    std::string level_transition_to = ""; // e.g., "level2", or "self" for reset
};


// ## Main Game Class ##
// Now, define the main Game class which uses the structs above.

class Game {
public:
    Game(int width, int height);

    void loadLevel(const std::string& levelData);
    void update(const std::string& input, float dt);

    // Getters to expose game data to TypeScript
    const GameState& getGameState() const;
    const Player& getPlayer() const;
    const std::vector<Box>& getPlatforms() const;
    const std::vector<Enemy>& getEnemies() const;
    const std::vector<Scenery>& getScenery() const;
    const std::vector<Door>& getDoors() const;

private:
    // Helper function for collision logic
    bool checkCollision(const Box& a, const Box& b);
    void resolvePlatformCollisions(Player& player, const Box& platform);

    // Screen dimensions
    int screenWidth;
    int screenHeight;

    // Game Objects
    Player player;
    GameState gameState;
    std::vector<Box> platforms;
    std::vector<Enemy> enemies;
    std::vector<Scenery> scenery;
    std::vector<Door> doors;
};
