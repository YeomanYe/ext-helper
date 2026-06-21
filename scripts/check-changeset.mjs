// @ts-check
/**
 * changeset 提交门禁（pre-commit 调用）
 *
 * 规则：暂存区动了「需发版」的文件（扩展源码 / 入口 / 运行时资源 / manifest 权限等），
 *      就要求 .changeset/ 下有一条本次提交带上的新 changeset 文件，否则阻止提交。
 *
 * 判定「需发版」= 全部暂存文件 **减去** SKIP_GLOBS 白名单（反向定义，避免枚举遗漏）。
 *      这样根目录 Plasmo 入口（popup.tsx）、resources/、manifest 的权限字段都天然覆盖。
 *
 * 判定「本次带上的新 changeset」：文件处于 untracked 或 staged（尚未进入 HEAD）。
 *      已被前一次 commit 吃掉的 changeset 不算（因为 version-packages 后它会被删掉）。
 *
 * 绕过：
 *   - CHANGESET_SKIP=1 git commit  —— 只跳过本门禁（lint-staged / typecheck 照跑）
 *   - git commit --no-verify       —— 全部 hook 都跳过（trivial 时用，慎用）
 */
import { execFileSync } from 'node:child_process'

/**
 * 明确【不需要】changeset 的文件 / 目录（被减去的白名单）。
 * 改了这里列的东西，门禁直接放行；其它默认都要配 changeset。
 *
 * 特例：package.json 不在此清单（见下方 touchesManifestBlock）——因为它既装依赖
 * （改 dependencies 不影响扩展行为）又内联 Plasmo manifest（改 permissions/host_*
 * 等高度影响用户），整文件级无法区分，需 diff 到 manifest 块字段级判定。
 */
const SKIP_GLOBS = [
  // 文档
  '*.md',
  'docs/',
  'CONTRIBUTING.md',
  'AGENTS.md',
  'CLAUDE.md',
  'LICENSE',
  // CI / 流程
  '.github/',
  '.changeset/',
  '.husky/',
  '.vscode/',
  // 构建脚本与配置（改这些不影响扩展产物对用户的表现）
  'scripts/',
  'eslint.config.*',
  '*.config.{js,ts,mjs,cjs}',
  'tsconfig*.json',
  'postcss.config.*',
  'tailwind.config.*',
  'vite.config.*',
  // 依赖清单与锁文件（package.json 单独处理：只放行非 manifest 字段，见下方）
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'package-lock.json',
  // 独立产物（网站走自己的发布，不进扩展版本）
  'website/',
  // 纯元数据
  '*.yml',
  '*.yaml',
  '*.toml',
  '*.json',
]

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
}

/** 暂存区（staged）文件列表，含新增与修改 */
function stagedFiles() {
  return git(['diff', '--cached', '--name-only', '--diff-filter=ACM'])
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

/** HEAD 里不存在的文件（untracked 或本次新 stage 的），用于识别「本次新带的 changeset」 */
function freshChangesetFiles() {
  const untracked = git(['status', '--porcelain'])
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => l.startsWith('?? ') || l.startsWith('A '))
    .map((l) => l.replace(/^(?:\?\?|A)\s+/, ''))
  return untracked.filter((f) => f.startsWith('.changeset/') && f.endsWith('.md'))
}

/** 把 glob 规则编译成针对单个 path 的匹配函数（支持目录前缀 + 文件名通配） */
function matchesSkip(file, pattern) {
  // 目录形式 'docs/' → 路径以该前缀开头
  if (pattern.endsWith('/')) return file.startsWith(pattern) || file.startsWith('./' + pattern)
  // 名字带通配 → 取 basename 匹配
  if (/[*?]/.test(pattern)) {
    const base = file.slice(file.lastIndexOf('/') + 1)
    return globMatch(pattern, base)
  }
  // 精确文件名 → basename 相等即可（路径无关，如 'CONTRIBUTING.md'）
  const base = file.slice(file.lastIndexOf('/') + 1)
  return base === pattern
}

/** 极简 glob：支持 * 任意串、{a,b,c} 分支、其它字面匹配 */
function globMatch(pattern, str) {
  let p = pattern
  // 展开 {a,b} → (?:a|b)
  p = p.replace(/\{([^}]+)\}/g, (_, group) => '(?:' + group.split(',').join('|') + ')')
  p = p.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  p = p.replace(/\*/g, '.*').replace(/\?/g, '.')
  return new RegExp('^(?:' + p + ')$').test(str)
}

/** 文件是否落在 SKIP 白名单里 */
function isSkipped(file) {
  return SKIP_GLOBS.some((pat) => matchesSkip(file, pat))
}

/** 触发门禁的文件 = 暂存文件 全部 减去 白名单 */
function releaseFiles(files) {
  return files.filter((f) => {
    if (!isSkipped(f)) return true
    // package.json 特殊处理：整文件不在白名单里，但要区分改了哪部分。
    // 改 manifest 块（权限 / host_permissions / web_accessible_resources / version 等
    // 用户可感知的扩展行为）→ 需要 changeset；只改 dependencies / scripts 等元信息 → 放行。
    if (f === 'package.json' || f.endsWith('/package.json')) {
      return touchesManifestBlock(f)
    }
    return false
  })
}

/**
 * package.json 的暂存 diff 是否触及 manifest 块。
 * Plasmo 把 manifest 内联在 package.json 的 "manifest" 字段里，改它 = 改扩展行为。
 * 用 git diff 看改动行是否落在 "manifest": { ... } 范围内。
 */
function touchesManifestBlock(file) {
  const diff = git(['diff', '--cached', '--unified=0', '--', file])
  // 先定位 manifest 块的起止行
  const lines = git(['show', ':' + file]).split('\n')
  let manifestStart = -1
  let depth = 0
  let manifestEnd = -1
  for (let i = 0; i < lines.length; i++) {
    if (manifestStart === -1) {
      if (/^\s*"manifest"\s*:\s*\{/.test(lines[i])) {
        manifestStart = i
        depth = 1
      }
    } else {
      for (const ch of lines[i]) {
        if (ch === '{') depth++
        else if (ch === '}') {
          depth--
          if (depth === 0) {
            manifestEnd = i
            break
          }
        }
      }
      if (manifestEnd !== -1) break
    }
  }
  if (manifestStart === -1) return false // 没有 manifest 块（如 website/package.json）

  // 从 diff 的 hunk header (@@ -a,b +c,d @@) 提取改动行号，看是否落在 [manifestStart, manifestEnd]
  const hunkRe = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/
  let line = 0
  for (const l of diff.split('\n')) {
    const m = hunkRe.exec(l)
    if (m) {
      line = parseInt(m[1], 10)
      continue
    }
    // diff 内容行：以 + 开头是新增（按新文件行号计）
    if (l.startsWith('+') && !l.startsWith('+++')) {
      if (line >= manifestStart && line <= manifestEnd) return true
      line++
    } else if (l.startsWith('-') && !l.startsWith('---')) {
      // 删除行不推进新文件行号，但若删除发生在 manifest 块附近也算触及
      // 简化：删除行无法精确映射新行号，保守按"改动落在块内"判断
      // （块边界用 show 的内容，删除行号近似 = 当前 line）
      if (line >= manifestStart && line <= manifestEnd) return true
    } else if (l.length === 0 || !l.startsWith('\\')) {
      // 上下文行（以空格开头）或空行，推进行号
      if (l.startsWith(' ')) line++
    }
  }
  return false
}

const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const GREEN = '\x1b[32m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

// S3: 显式旁路 —— 只跳过本门禁，其它 hook（lint-staged/typecheck）照跑
if (process.env.CHANGESET_SKIP === '1') {
  console.log(`${YELLOW}·${RESET} ${DIM}CHANGESET_SKIP=1，跳过 changeset 门禁${RESET}`)
  process.exit(0)
}

const files = stagedFiles()
const release = releaseFiles(files)

if (release.length === 0) {
  // 没动需发版代码（纯文档 / 配置 / 脚本），放行
  process.exit(0)
}

const fresh = freshChangesetFiles()

if (fresh.length > 0) {
  console.log(`${GREEN}✓${RESET} changeset 已记录：${DIM}${fresh.join(', ')}${RESET}`)
  process.exit(0)
}

// 拦截
console.error('')
console.error(`${RED}✗ 提交被阻止${RESET}：本次改动包含需发版的文件，但没有对应的 changeset。`)
console.error('')
console.error(`${YELLOW}changed${RESET}（这些动了扩展产物，需要 changeset）：`)
release.slice(0, 12).forEach((f) => console.error(`     ${f}`))
if (release.length > 12) console.error(`     …还有 ${release.length - 12} 个`)
console.error('')
console.error(`${YELLOW}why${RESET}：按规范每条用户可见改动都要配一条 changeset（一个功能一条），`)
console.error(`     发布时由 version-packages 汇总进 CHANGELOG。`)
console.error('')
console.error(`${YELLOW}fix${RESET}：跑下面的命令补一条（选 minor/patch，写一句面向用户的说明）：`)
console.error(`     ${DIM}pnpm changeset${RESET}`)
console.error('')
console.error(`${YELLOW}bypass${RESET}：本次确实是 trivial（文档 / typo / WIP）？`)
console.error(`     ${DIM}CHANGESET_SKIP=1 git commit ...${RESET}  只跳过本门禁`)
console.error(`     ${DIM}git commit --no-verify ...${RESET}       全部 hook 跳过（慎用）`)
console.error('')
process.exit(1)
