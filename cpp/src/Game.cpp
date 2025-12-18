#include "Game.hpp"
#include <cmath> // For std::abs

// Game constants
const float GRAVITY = 0.5f;
const float JUMP_FORCE = -12.0f;
const float MOVE_SPEED = 5.0f;
const float MAX_FALL_SPEED = 10.0f;
const float FRICTION = 0.8f;
const int SCREEN_WIDTH = 800;
const int SCREEN_HEIGHT = 600;

// Stomp constants
const float STOMP_BOUNCE_VELOCITY = -6.0f;
const float STOMP_TOLERANCE = 10.0f;

// --- Constructor: New Level Layout ---
// Here we define the test level
Game::Game() : player({ { 100, 450, 32, 48 }, 0, 0, false, 0, 0, 0 }), camera({ 0, 0 }) {
    // A long, continuous floor
    platforms.push_back({ 0, 550, 1600, 50 });

    // A stack of platforms to test jumping
    platforms.push_back({ 250, 450, 150, 20 });
    platforms.push_back({ 450, 380, 150, 20 });

    // A wall to test horizontal collision
    platforms.push_back({ 800, 350, 20, 200 });

    // A small "roof" or ceiling to test head-bumping
    platforms.push_back({ 450, 250, 150, 20 });
    
    // A high, unreachable platform to tease a future ability
    platforms.push_back({ 1000, 200, 200, 20});

    // --- Add Enemies to the level ---
    // An enemy walking on the main floor
    enemies.push_back({ { 600, 502, 32, 48 }, -1.0f, false, 1 }); // Starts moving left

    // An enemy on a higher platform
    enemies.push_back({ { 500, 332, 32, 48 }, 1.0f, false, 0 }); // Starts moving right

    generateBackground();
}

void Game::update(bool left, bool right, bool jump) {
    soundData.clear();

    // Player horizontal movement
    if (left) {
        player.velocityX = -MOVE_SPEED;
        player.facingDirection = 1;
    } else if (right) {
        player.velocityX = MOVE_SPEED;
        player.facingDirection = 0;
    }
    player.rect.x += player.velocityX;

    // Horizontal collision with platforms
    for (const auto& platform : platforms) {
        if (player.rect.x < platform.x + platform.width && player.rect.x + player.rect.width > platform.x &&
            player.rect.y < platform.y + platform.height && player.rect.y + player.rect.height > platform.y) {
            if (player.velocityX > 0) {
                player.rect.x = platform.x - player.rect.width;
            } else if (player.velocityX < 0) {
                player.rect.x = platform.x + platform.width;
            }
            player.velocityX = 0;
        }
    }

    // Player vertical movement & gravity
    player.velocityY += GRAVITY;
    if (player.velocityY > MAX_FALL_SPEED) {
        player.velocityY = MAX_FALL_SPEED;
    }
    player.rect.y += player.velocityY;

    // Vertical collision with platforms
    player.onGround = false;
    for (const auto& platform : platforms) {
        if (player.rect.x < platform.x + platform.width && player.rect.x + player.rect.width > platform.x &&
            player.rect.y < platform.y + platform.height && player.rect.y + player.rect.height > platform.y) {
            if (player.velocityY > 0) {
                player.rect.y = platform.y - player.rect.height;
                player.velocityY = 0;
                player.onGround = true;
            } else if (player.velocityY < 0) {
                player.rect.y = platform.y + platform.height;
                player.velocityY = 0;
            }
        }
    }

    // Jumping
    if (jump && player.onGround) {
        player.velocityY = JUMP_FORCE;
        soundData.push_back(1.0f); // Sound ID for jump
    }

    // Apply friction
    player.velocityX *= FRICTION;
    if (std::abs(player.velocityX) < 0.1) {
        player.velocityX = 0;
    }
    
    // --- NEW: Enemy Logic ---
    for (auto& enemy : enemies) {
        if (enemy.isDefeated) continue;

        // Simple back-and-forth movement
        enemy.rect.x += enemy.velocityX;

        // Enemy collision with platforms (turn around at edges or walls)
        bool enemyOnGround = false;
        for (const auto& platform : platforms) {
            // Check for wall collision
            if (enemy.rect.x < platform.x + platform.width && enemy.rect.x + enemy.rect.width > platform.x &&
                enemy.rect.y < platform.y + platform.height && enemy.rect.y + enemy.rect.height > platform.y) {
                 if(enemy.velocityX > 0) enemy.rect.x = platform.x - enemy.rect.width;
                 else enemy.rect.x = platform.x + platform.width;
                 enemy.velocityX *= -1; // Turn around
                 enemy.facingDirection = (enemy.velocityX > 0) ? 0 : 1;
            }
        }

        // --- NEW: Player-Enemy Collision Logic ---
        if (!enemy.isDefeated && 
            player.rect.x < enemy.rect.x + enemy.rect.width && player.rect.x + player.rect.width > enemy.rect.x &&
            player.rect.y < enemy.rect.y + enemy.rect.height && player.rect.y + player.rect.height > enemy.rect.y)
        {
            // Check for stomp
            bool isStomp = player.velocityY > 0 && (player.rect.y + player.rect.height) < (enemy.rect.y + STOMP_TOLERANCE);
            if (isStomp) {
                enemy.isDefeated = true;
                player.velocityY = STOMP_BOUNCE_VELOCITY; // Give player a bounce
                // Optional: add a "stomp" sound
            } else {
                // Player got hit, you can add damage logic here
                // For now, let's just reset the player's position
                player.rect.x = 100;
                player.rect.y = 450;
                player.velocityX = 0;
                player.velocityY = 0;
            }
        }
    }

    // Camera follow player
    camera.x = player.rect.x - SCREEN_WIDTH / 2 + player.rect.width / 2;
    camera.y = 0; // Static Y camera for now
    if (camera.x < 0) camera.x = 0;
}

const std::vector<float>& Game::getRenderData() {
    renderData.clear();
    
    // Player data
    renderData.push_back(player.rect.x - camera.x);
    renderData.push_back(player.rect.y - camera.y);
    renderData.push_back(player.rect.width);
    renderData.push_back(player.rect.height);
    renderData.push_back(player.facingDirection == 1 ? 32.0f : 0.0f); // u (texture x)
    renderData.push_back(0.0f); // v (texture y)
    renderData.push_back(32.0f); // u_width
    renderData.push_back(48.0f); // v_height

    // Platform data
    for (const auto& p : platforms) {
        renderData.push_back(p.x - camera.x);
        renderData.push_back(p.y - camera.y);
        renderData.push_back(p.width);
        renderData.push_back(p.height);
        renderData.push_back(0.0f); renderData.push_back(64.0f); // Using platform texture
        renderData.push_back(64.0f); renderData.push_back(64.0f);
    }
    
    // --- NEW: Enemy Render Data ---
    for (const auto& enemy : enemies) {
        if(enemy.isDefeated) continue;
        renderData.push_back(enemy.rect.x - camera.x);
        renderData.push_back(enemy.rect.y - camera.y);
        renderData.push_back(enemy.rect.width);
        renderData.push_back(enemy.rect.height);
        // Using a different part of the sprite sheet for the enemy
        renderData.push_back(enemy.facingDirection == 1 ? 96.0f : 64.0f); // u
        renderData.push_back(0.0f); // v
        renderData.push_back(32.0f); // u_width
        renderData.push_back(48.0f); // v_height
    }

    return renderData;
}


void Game::generateBackground() {
    backgroundData.clear();
    for (int i = 0; i < 20; ++i) { // 20 layers for parallax
        backgroundData.push_back(i * 100.0f); // x
        backgroundData.push_back(200.0f + sin(i * 0.5f) * 50); // y
        backgroundData.push_back(1.0f + (i % 3)); // type
        backgroundData.push_back(0.1f * i); // parallax factor
    }
}

const std::vector<float>& Game::getBackgroundData() {
    return backgroundData;
}

const std::vector<float>& Game::getSoundData() {
    return soundData;
}
