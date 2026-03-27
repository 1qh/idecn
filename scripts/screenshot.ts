/** biome-ignore-all lint/nursery/noPlaywrightWaitForSelector: screenshot script */
/** biome-ignore-all lint/nursery/noPlaywrightWaitForTimeout: screenshot script */
/* eslint-disable no-console */
import { chromium } from '@playwright/test'
import { resolve } from 'node:path'
const browser = await chromium.launch(),
  page = await browser.newPage({ deviceScaleFactor: 2, viewport: { height: 720, width: 1280 } })
await page.goto('http://localhost:3000')
await page.waitForSelector('nav[aria-label="File tree"]')
await page.waitForSelector('.monaco-editor', { timeout: 15_000 })
await page.waitForTimeout(3000)
const out = resolve(import.meta.dir, '../screenshot.png')
await page.screenshot({ path: out })
await browser.close()
console.log(`Screenshot saved to ${out}`)
