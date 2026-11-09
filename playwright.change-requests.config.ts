import { defineConfig } from '@playwright/test'
import { resolve } from 'node:path'
import base from './playwright.config'

const integrated = Boolean(process.env.CR05_BACKEND_URL)
const baseURL = `http://127.0.0.1:${integrated ? 3097 : 3098}`

export default defineConfig({
  ...base,
  use: { ...base.use, baseURL },
  testMatch: 'change-request-release.spec.ts',
  outputDir: process.env.CR05_BACKEND_URL
    ? '.tmp/cr05-playwright/integrated'
    : '.tmp/cr05-playwright/results',
  reporter: [
    ['list'],
    [
      'json',
      {
        outputFile: process.env.CR05_BACKEND_URL
          ? '.tmp/cr05-playwright/integrated.json'
          : '.tmp/cr05-playwright/results.json',
      },
    ],
  ],
  webServer: {
    command: integrated
      ? 'node ../../node_modules/next/dist/bin/next dev --webpack --hostname 127.0.0.1 --port 3097'
      : 'npm run smoke:e01',
    cwd: integrated ? resolve('test/e01-smoke') : process.cwd(),
    url: `${baseURL}/en/standalone-confirmations`,
    reuseExistingServer: !integrated,
    timeout: 240_000,
  },
})
