import { defineConfig } from '@playwright/test'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const origin = 'http://127.0.0.1:4183'

export default defineConfig({
  testDir: './tests/browser',
  timeout: 45_000,
  workers: 2,
  reporter: 'list',
  use: {
    baseURL: origin,
    browserName: 'chromium',
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    headless: true,
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'node scripts/serve-export.mjs',
    url: `${origin}${basePath}/`,
    reuseExistingServer: false,
    timeout: 10_000
  }
})
