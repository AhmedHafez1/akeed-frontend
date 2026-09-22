import { defineConfig, devices } from '@playwright/test'

/*
 * US-04.6-10 release-gate browser flows. They drive the real import and
 * Verifications UI inside the e01-smoke fixture app (port 3098), which
 * replays API answers recorded from the real backend. No sign-in, database or
 * message send is involved. Run with `npm run e2e:order-imports`.
 */
export default defineConfig({
  testDir: './test/e2e',
  outputDir: './output/playwright/order-imports/release-gate/results',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:3098',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npm run smoke:e01',
    url: 'http://127.0.0.1:3098/en/imports/new',
    reuseExistingServer: true,
    timeout: 240_000,
  },
})
