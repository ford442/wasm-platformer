import { expect, test } from '@playwright/test';

test('loads the app shell without console errors', async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  await page.route('**/src/wasm/main.js*', async (route) => {
    await route.fulfill({
      contentType: 'application/javascript; charset=utf-8',
      body: `
        class Vector {
          constructor(items) {
            this.items = items;
          }
          get(index) {
            return this.items[index];
          }
          size() {
            return this.items.length;
          }
        }

        class Game {
          update() {}
          handleInput() {}
          getPlayerPosition() { return { x: 0, y: 0 }; }
          getPlayerSize() { return { x: 1, y: 1 }; }
          getCameraPosition() { return { x: 0, y: 0 }; }
          getPlatforms() { return new Vector([]); }
          getGoals() { return new Vector([]); }
          getParticles() { return new Vector([]); }
          getPlayerAnimationState() { return { currentState: 'idle', currentFrame: 0, facingLeft: false }; }
          getLevelName() { return 'Smoke Test Level'; }
          getLevelDescription() { return 'Loaded with a stubbed WASM module.'; }
          setSoundCallback() {}
          loadLevel() {}
          setLevelCompleteCallback() {}
          switchCharacter() {}
          getCurrentCharacter() { return 0; }
          useAbility() {}
          getAbilityState() { return 0; }
          getAbilityCooldownPercent() { return 0; }
          delete() {}
        }

        export default async function createWasmModule() {
          return { Game };
        }
      `,
    });
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Bolts & Volts' })).toBeVisible();
  await expect(page.getByText('Smoke Test Level')).toBeVisible();
  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
});
