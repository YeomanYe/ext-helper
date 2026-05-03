import path from "node:path"
import { fileURLToPath } from "node:url"

import { chromium } from "playwright"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage({
    viewport: { width: 300, height: 300 },
    deviceScaleFactor: 1
  })
  const entry = path.join(__dirname, "edge-store-logo.html")
  await page.goto(`file://${entry}`, { waitUntil: "load" })
  await page.waitForFunction(() => document.body.dataset.ready === "true", {
    timeout: 5000
  })
  const out = path.join(
    __dirname,
    "ext-helper-edge-store-logo-300x300.png"
  )
  await page.screenshot({
    path: out,
    type: "png",
    omitBackground: false,
    clip: { x: 0, y: 0, width: 300, height: 300 }
  })
  console.log("wrote", out)
} finally {
  await browser.close()
}
