/** biome-ignore-all lint/nursery/noPlaywrightWaitForSelector: screenshot script */
/** biome-ignore-all lint/nursery/noPlaywrightWaitForTimeout: screenshot script */
/* eslint-disable no-console */
import { chromium } from '@playwright/test'
import { resolve } from 'node:path'
const url = process.argv[2]
if (!url) throw new Error('Usage: bun scripts/screenshot.ts <url>')
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { height: 1800, width: 2400 } })
await page.goto(url)
await page.evaluate(() => {
  document.documentElement.style.zoom = '2'
})
await page.waitForSelector('nav[aria-label="File tree"]')
await page.waitForSelector('.monaco-editor', { timeout: 15_000 })
await page.waitForTimeout(2000)
await page.keyboard.press('Meta+p')
await page.waitForTimeout(1000)
const out = resolve(import.meta.dir, '../screenshot.png')
await page.screenshot({ path: out })
await browser.close()
console.log(`Screenshot saved to ${out}`)
