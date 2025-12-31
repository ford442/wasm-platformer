#ifndef PARTICLE_SYSTEM_HPP
#define PARTICLE_SYSTEM_HPP

#include <vector>
#include <string>
#include "Types.hpp"

struct Particle {
    Vec2 position;
    Vec2 velocity;
    float life;      // Remaining life in seconds
    float maxLife;   // Total life duration
    float size;
    float rotation;
    float angularVelocity;
    // We can add color or type later if needed
};

class ParticleSystem {
public:
    ParticleSystem() {}

    void update(float deltaTime) {
        for (auto it = particles.begin(); it != particles.end(); ) {
            it->life -= deltaTime;
            if (it->life <= 0) {
                it = particles.erase(it);
            } else {
                it->position.x += it->velocity.x * deltaTime;
                it->position.y += it->velocity.y * deltaTime;
                it->rotation += it->angularVelocity * deltaTime;
                ++it;
            }
        }
    }

    void emit(Vec2 position, Vec2 velocity, float life, float size, float angularVelocity = 0.0f) {
        Particle p;
        p.position = position;
        p.velocity = velocity;
        p.life = life;
        p.maxLife = life;
        p.size = size;
        p.rotation = 0.0f;
        p.angularVelocity = angularVelocity;
        particles.push_back(p);
    }

    const std::vector<Particle>& getParticles() const {
        return particles;
    }

private:
    std::vector<Particle> particles;
};

#endif // PARTICLE_SYSTEM_HPP
