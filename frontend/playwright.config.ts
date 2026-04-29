import { defineConfig, devices } from '@playwright/test';

// Playwright runs its own Vite on a non-forwarded port so it doesn't fight
// with whatever the user has running on 5173. API responses are intercepted
// per-spec via `page.route()` — the .NET API does not need to be running for
// e2e specs to pass. (Backend integration is covered by xUnit; Playwright
// covers frontend behavior in a real browser.)
const PLAYWRIGHT_PORT = 5175;

export default defineConfig({
  testDir: '../tests-e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'list' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PLAYWRIGHT_PORT}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `pnpm exec vite --port ${PLAYWRIGHT_PORT} --strictPort`,
    url: `http://localhost:${PLAYWRIGHT_PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
