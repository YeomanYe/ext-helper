import path from "node:path"
import { fileURLToPath } from "node:url"

import { chromium } from "playwright"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const assets = [
  { id: "overview", width: 1280, height: 800, output: "ext-helper-overview-1280x800.png" },
  { id: "bisect", width: 1280, height: 800, output: "ext-helper-bisect-1280x800.png" },
  { id: "automation", width: 1280, height: 800, output: "ext-helper-automation-1280x800.png" },
  { id: "chromeSmall", width: 440, height: 280, output: "ext-helper-chrome-small-promo-440x280.png" },
  { id: "chromeMarquee", width: 1400, height: 560, output: "ext-helper-chrome-marquee-1400x560.png" }
]

const browser = await chromium.launch({ headless: true })

try {
  const page = await browser.newPage()
  const entry = path.join(__dirname, "index.html")

  for (const asset of assets) {
    await page.setViewportSize({ width: asset.width, height: asset.height })
    await page.goto(`file://${entry}?asset=${asset.id}`, { waitUntil: "load" })
    await page.waitForFunction(() => document.body.dataset.ready === "true")
    await page.screenshot({
      path: path.join(__dirname, asset.output),
      type: "png"
    })
    console.log(`${asset.id} -> ${asset.output}`)
  }
} finally {
  await browser.close()
}
