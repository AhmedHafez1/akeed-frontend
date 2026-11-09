import { defineConfig } from '@playwright/test'
import { resolve } from 'node:path'
export default defineConfig({
  testDir: './test/e2e',
  testMatch: 'template-preparation.spec.ts',
  workers: 1,
  timeout: 120000,
  outputDir: '.tmp/template-preparation-browser',
  reporter: [
    ['list'],
    ['json', { outputFile: '.tmp/template-preparation-browser/results.json' }],
  ],
  use: { baseURL: 'http://127.0.0.1:3096', trace: 'retain-on-failure' },
  webServer: {
    command:
      'node ../../node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3096',
    cwd: resolve('test/e01-smoke'),
    url: 'http://127.0.0.1:3096/en/admin-template-preparation',
    reuseExistingServer: false,
    timeout: 240000,
  },
})
