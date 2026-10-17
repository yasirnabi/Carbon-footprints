import { defineConfig, devices } from '@playwright/test'

/**
 * E2E against the real API: the webServer builds the app, starts ../carbon-api in memory on API_PORT, seeds the demo
 * dataset into three dev companies and serves the bundle with `vite preview` (proxying /api). Chromium comes from
 * PLAYWRIGHT_BROWSERS_PATH (/opt/pw-browsers, revision 1194 = Playwright 1.56.1); never run `playwright install`.
 */
const API_PORT = process.env.E2E_API_PORT ?? '8788'
const WEB_PORT = process.env.E2E_WEB_PORT ?? '4174'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  use: { baseURL: `http://127.0.0.1:${WEB_PORT}`, trace: 'retain-on-failure', viewport: { width: 1440, height: 900 } },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }],
  webServer: {
    command: `npm run build && API_PORT=${API_PORT} WEB_PORT=${WEB_PORT} npx tsx scripts/stack.ts --preview`,
    url: `http://127.0.0.1:${WEB_PORT}`,
    timeout: 240_000,
    reuseExistingServer: false,
    stdout: 'pipe',
  },
})
