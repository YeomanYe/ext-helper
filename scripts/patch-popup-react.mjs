// Plasmo 0.90.5 prod-build bug workaround.
//
// Symptom: `plasmo build` emits a popup.*.js bundle that externalizes react,
// react-dom, react/jsx-runtime, AND every @/ business module — leaving a 9 KB
// shell that dies at runtime with `Cannot find module 'react/jsx-runtime'`.
// Dev builds work; only prod is broken. Affects popup, background, and
// content-script bundles alike (Parcel's shared-bundle dedup is misfiring).
//
// Fix: re-bundle popup with Vite (Rollup) into a single self-contained IIFE,
// overwrite Plasmo's popup.*.js + popup.*.css, and rewrite popup.html to
// reference the new asset names. Idempotent. Pass --zip to repackage the
// directory into `<target>.zip` afterwards.

import { build } from "vite"
import react from "@vitejs/plugin-react"
import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import { readFile, readdir, writeFile, rm, stat, writeFile as fsWriteFile } from "node:fs/promises"
import { join, resolve } from "node:path"

const SHOULD_ZIP = process.argv.includes("--zip")
const BUILD_DIRS = ["build/chrome-mv3-prod", "build/edge-mv3-prod"]

const ENTRY_TEMPLATE = `import * as React from "react"
import { createRoot } from "react-dom/client"
import { PopupPage } from "~src/components/PopupPage"
import { applyStoredThemeDom } from "~src/utils/theme"
import "~src/styles/globals.css"

applyStoredThemeDom()

const container = document.getElementById("__plasmo") ?? document.getElementById("root")
if (container) {
  const root = createRoot(container)
  root.render(<React.StrictMode><PopupPage /></React.StrictMode>)
}
`

function sha8(s) {
  return createHash("sha256").update(s).digest("hex").slice(0, 8)
}

async function rezip(buildDir) {
  const absBuildDir = resolve(buildDir)
  const zipPath = `${absBuildDir}.zip`
  await rm(zipPath, { force: true })
  const result = spawnSync("zip", ["-r", "-X", zipPath, "."], {
    cwd: absBuildDir,
    stdio: "ignore",
  })
  if (result.status !== 0) {
    throw new Error(`zip failed for ${buildDir} (exit ${result.status})`)
  }
  console.log(`[patch-popup-react] wrote ${zipPath}`)
}

async function patchBuildDir(buildDir) {
  let files
  try {
    files = await readdir(buildDir)
  } catch (e) {
    if (e.code === "ENOENT") {
      console.log(`[patch-popup-react] ${buildDir} does not exist, skipping`)
      return
    }
    throw e
  }

  // Only patch if plasmo's popup bundle is broken (react externalized).
  const plasmoPopup = files.find((f) => /^popup\.[a-f0-9]+\.js$/.test(f))
  if (!plasmoPopup) {
    console.log(`[patch-popup-react] ${buildDir}: no popup.*.js, skipping`)
    if (SHOULD_ZIP) await rezip(buildDir)
    return
  }
  const plasmoPopupContent = await readFile(join(buildDir, plasmoPopup), "utf8")
  const isBroken = /"react\/jsx-runtime":"react\/jsx-runtime"/.test(plasmoPopupContent)
  if (!isBroken) {
    console.log(`[patch-popup-react] ${buildDir}: popup is healthy, skipping`)
    if (SHOULD_ZIP) await rezip(buildDir)
    return
  }

  const cwd = process.cwd()
  const entryPath = join(cwd, ".popup-patch-entry.tsx")
  await fsWriteFile(entryPath, ENTRY_TEMPLATE)

  const viteOutDir = join(cwd, buildDir, "__popup_patch__")
  try {
    await build({
      configFile: false,
      plugins: [react()],
      resolve: {
        alias: {
          "@": join(cwd, "src"),
          "~src": join(cwd, "src"),
        },
      },
      build: {
        outDir: viteOutDir,
        emptyOutDir: true,
        lib: {
          entry: entryPath,
          name: "ExtHelperPopup",
          formats: ["iife"],
          fileName: () => "popup.js",
        },
        cssCodeSplit: false,
        rollupOptions: {
          output: {
            inlineDynamicImports: true,
            assetFileNames: "popup.css",
          },
        },
      },
      define: { "process.env.NODE_ENV": '"production"' },
    })
  } finally {
    await rm(entryPath, { force: true })
  }

  const patchedJs = await readFile(join(viteOutDir, "popup.js"), "utf8")
  const patchedCss = await readFile(join(viteOutDir, "popup.css"), "utf8")

  const jsHash = sha8(patchedJs)
  const cssHash = sha8(patchedCss)
  const newJsName = `popup.${jsHash}.js`
  const newCssName = `popup.${cssHash}.css`

  await writeFile(join(buildDir, newJsName), patchedJs)
  await writeFile(join(buildDir, newCssName), patchedCss)

  // Clean up: remove plasmo's broken popup.*.js/css and the temp vite out dir.
  for (const f of files) {
    if (/^popup\.[a-f0-9]+\.js$/.test(f) || /^popup\.[a-f0-9]+\.css$/.test(f)) {
      await rm(join(buildDir, f))
    }
  }
  await rm(viteOutDir, { recursive: true, force: true })

  // Rewrite popup.html — keep plasmo's structure but point to new assets.
  const popupHtmlPath = join(buildDir, "popup.html")
  const html = await readFile(popupHtmlPath, "utf8")
  const newHtml = html
    .replace(/<link[^>]*href="\/popup\.[a-f0-9]+\.css"[^>]*>/g, "")
    .replace(/<script[^>]*src="\/popup\.[a-f0-9]+\.js"[^>]*><\/script>/g, "")
    .replace(
      /<\/head>/,
      `  <link rel="stylesheet" href="/${newCssName}">\n  </head>`
    )
    .replace(
      /<\/body>/,
      `  <script src="/${newJsName}" defer></script>\n  </body>`
    )
  await writeFile(popupHtmlPath, newHtml)

  console.log(
    `[patch-popup-react] ${buildDir}: replaced popup bundle → ${newJsName} (${patchedJs.length} bytes) + ${newCssName} (${patchedCss.length} bytes)`
  )

  if (SHOULD_ZIP) await rezip(buildDir)
}

for (const dir of BUILD_DIRS) {
  try {
    await patchBuildDir(dir)
  } catch (e) {
    console.error(`[patch-popup-react] error in ${dir}:`, e)
    process.exit(1)
  }
}
