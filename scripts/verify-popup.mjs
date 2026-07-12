// Headless smoke test: load patched popup.html and confirm React mounts.

import { chromium } from "playwright"
import { mkdtemp, copyFile, readFile, writeFile, rm, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

const target = process.argv[2] || "chrome-mv3-prod"
const srcDir = `build/${target}`

const tmp = await mkdtemp(join(tmpdir(), `popup-verify-${target}-`))

// Rewrite root-absolute paths to relative (file:// can't resolve /xxx).
const origHtml = await readFile(join(srcDir, "popup.html"), "utf8")
const referenced = origHtml.match(/\/[a-z0-9.\-/]+\.(js|css)/g) || []
const names = new Set(referenced.map((p) => p.slice(1)))
for (const name of names) {
  await copyFile(join(srcDir, name), join(tmp, name))
}
const tmpHtml = origHtml
  .replace(/href="\/([a-z0-9.\-/]+\.(?:js|css))"/g, 'href="$1"')
  .replace(/src="\/([a-z0-9.\-/]+\.(?:js|css))"/g, 'src="$1"')
await writeFile(join(tmp, "popup.html"), tmpHtml)

const url = pathToFileURL(join(tmp, "popup.html")).href

const browser = await chromium.launch()
const page = await browser.newPage()
const pageErrors = []
const failedRequests = []
page.on("pageerror", (e) => pageErrors.push(e.message))
page.on("requestfailed", (r) =>
  failedRequests.push(`${r.url().replace(url, "")} ${r.failure()?.errorText}`)
)

await page.goto(url, { waitUntil: "load" })
await page.waitForTimeout(1000)

const plasmoChildCount = await page.evaluate(
  () => document.getElementById("__plasmo")?.children.length ?? 0
)
const plasmoSnippet = await page.evaluate(
  () => document.getElementById("__plasmo")?.innerHTML?.slice(0, 150) ?? null
)

await browser.close()
await rm(tmp, { recursive: true, force: true })

console.log(
  JSON.stringify(
    { target, plasmoChildCount, plasmoSnippet, pageErrors, failedRequests },
    null,
    2
  )
)
process.exit(plasmoChildCount > 0 && pageErrors.length === 0 ? 0 : 1)
