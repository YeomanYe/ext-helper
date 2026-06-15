// 把 package.json 顶层 version 同步到 manifest.version。
// changeset version 只改顶层 version，本脚本补齐扩展 manifest 的版本号。
// 由 `pnpm version-packages` 在 changeset version 之后自动调用。
import { readFileSync, writeFileSync } from "node:fs"

const pkgUrl = new URL("../package.json", import.meta.url)
const pkg = JSON.parse(readFileSync(pkgUrl, "utf8"))

if (!pkg.manifest) {
  console.log("· package.json 无 manifest 字段，跳过")
  process.exit(0)
}

if (pkg.manifest.version === pkg.version) {
  console.log(`· manifest.version 已是 ${pkg.version}`)
  process.exit(0)
}

const old = pkg.manifest.version
pkg.manifest.version = pkg.version
writeFileSync(pkgUrl, JSON.stringify(pkg, null, 2) + "\n")
console.log(`✓ manifest.version ${old} → ${pkg.version}`)
