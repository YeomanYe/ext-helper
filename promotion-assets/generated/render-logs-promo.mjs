import path from "node:path"
import { fileURLToPath } from "node:url"

import { chromium } from "playwright"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const entry = path.join(__dirname, "ext-helper-chrome-logs-1280x800.html")
const output = path.join(__dirname, "ext-helper-chrome-logs-1280x800.png")

const browser = await chromium.launch({ headless: true })

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await page.goto(`file://${entry}`, { waitUntil: "load" })
  await page.waitForFunction(() =>
    Array.from(document.images).every((img) => img.complete && img.naturalWidth > 0)
  )
  await page.screenshot({ path: output, type: "png" })
  console.log(`logs -> ${path.basename(output)}`)
} finally {
  await browser.close()
}
