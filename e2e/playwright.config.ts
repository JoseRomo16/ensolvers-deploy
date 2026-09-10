import { defineConfig, devices } from '@playwright/test';

/**
 * The suite drives the real SPA against the real API, so it expects the stack
 * from `./start.sh` (or docker compose) to already be up.
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  expect: { timeout: 10_000 },

  // Every test shares one database, so they run sequentially. The tests still
  // namespace the data they create, but serial execution keeps list assertions
  // from racing each other.
  fullyParallel: false,
  workers: 1,

  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,

  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list']],

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
