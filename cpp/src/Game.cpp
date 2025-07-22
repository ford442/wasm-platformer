void Game::update(float deltaTime) {
    // --- Apply Gravity ---
    if (!isGrounded) {
        playerVelocity.y += gravity * deltaTime;
    }

    // --- Separate Axis Movement & Collision (Y-Axis First) ---
    // By handling vertical movement first, we ensure the player lands stably
    // on platforms before checking for horizontal collisions. This prevents
    // the "knocked off on spawn" bug.

    // --- Move on Y Axis ---
    playerPosition.y += playerVelocity.y * deltaTime;
    isGrounded = false; // Assume not grounded until a vertical collision proves otherwise.
    for (const auto& platform : platforms) {
        if (checkCollision(playerPosition, playerSize, platform.position, platform.size)) {
            float playerHalfY = playerSize.y / 2.0f;
            float platformHalfY = platform.size.y / 2.0f;
            float deltaY = playerPosition.y - platform.position.y;
            float penetrationY = (playerHalfY + platformHalfY) - std::abs(deltaY);

            if (deltaY > 0) { // Player is above the platform center (landing on it)
                playerPosition.y += penetrationY;
                if (playerVelocity.y < 0) {
                    playerVelocity.y = 0;
                }
                isGrounded = true; // We have landed!
            } else { // Player is below the platform center (hitting their head)
                playerPosition.y -= penetrationY;
                if (playerVelocity.y > 0) {
                    playerVelocity.y = 0;
                }
            }
        }
    }
    
    // --- Move on X Axis ---
    playerPosition.x += playerVelocity.x * deltaTime;
    for (const auto& platform : platforms) {
        if (checkCollision(playerPosition, playerSize, platform.position, platform.size)) {
            float playerHalfX = playerSize.x / 2.0f;
            float platformHalfX = platform.size.x / 2.0f;
            float deltaX = playerPosition.x - platform.position.x;
            float penetrationX = (playerHalfX + platformHalfX) - std::abs(deltaX);
            
            if (deltaX > 0) {
                playerPosition.x += penetrationX;
            } else {
                playerPosition.x -= penetrationX;
            }
            playerVelocity.x = 0;
        }
    }
    
    // --- Animation Logic ---
    std::string newState = "idle";
    if (!isGrounded) {
        newState = "jump";
    } else if (std::abs(playerVelocity.x) > 0.01f) {
        newState = "run";
    }

    if (newState != playerAnimation.currentState) {
        playerAnimation.currentState = newState;
        playerAnimation.currentFrame = 0;
        animationTimer = 0.0f;
    }

    animationTimer += deltaTime;
    float frameDuration = 0.1f;
    while (animationTimer >= frameDuration) {
        animationTimer -= frameDuration;
        playerAnimation.currentFrame = (playerAnimation.currentFrame + 1);
    }

    // --- Update Camera ---
    cameraPosition.x = playerPosition.x;
}
