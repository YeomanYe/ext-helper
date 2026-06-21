# 贡献与工程规范

> 本文件是 **ext-helper 工程规范的总入口**。AI agent（Claude Code / Codex）和人类贡献者都从这里起步。
> 详细的分域规则在 [`docs/`](docs/index.md)；`AGENTS.md` / `CLAUDE.md` 只是指向本文件的指针。

## 规则路由

先看 [`docs/index.md`](docs/index.md) 总路由；按任务直达分域：

| 你要干什么 | 看哪个域 |
|---|---|
| 改架构 / 数据流 / 加 store / repository | [`docs/architecture/`](docs/architecture/index.md) |
| 写组件 / 编码约定 / 测试 | [`docs/coding/`](docs/coding/index.md) |
| 改样式 / punk 主题 / 设计 token / 设计稿 | [`docs/ui/`](docs/ui/index.md) |
| 扩展运行时 / 权限 / manifest / 跨浏览器 | [`docs/extension/`](docs/extension/index.md) |
| 产品需求 / 发布 | [`docs/prd.md`](docs/prd.md) · [`PUBLISH_GUIDE.md`](PUBLISH_GUIDE.md) |

> 开始改代码前，至少读对应域的 `rules.md`。

## 快速命令

```bash
pnpm dev            # Plasmo dev（Chrome MV3）
pnpm dev:firefox    # Plasmo dev（Firefox MV2）
pnpm dev:web        # Vite web 预览模式（mock 数据，无扩展 API）
pnpm build          # Plasmo 生产构建

pnpm lint           # ESLint 检查（lint:fix 自动修）
pnpm typecheck      # tsc --noEmit 类型检查
pnpm test           # vitest（watch）；门禁用 pnpm test:run
pnpm format         # Prettier 格式化
pnpm check          # 聚合门禁：lint + typecheck + test:run + build

pnpm changeset      # 记录一条变更（选 bump 级别 + 写 changelog）
pnpm version-packages  # 应用 changeset → 升版本号 + 写 CHANGELOG
```

## 提交规范

Conventional Commits（`commitlint.config.js` 强制，commit-msg 钩子校验）：

- 类型：`feat` / `fix` / `refactor` / `docs` / `test` / `chore` / `perf` / `ci` / `revert`
- 允许中文 subject；header ≤ 100 字
- 例：`feat(rules): 支持按 schedule 自动禁用扩展`

## 质量门禁

规则落到机制上强制执行，不只是写在文档里：

- **pre-commit**（`.husky/pre-commit`）：lint-staged 对暂存文件跑 `eslint --fix` + `prettier --write`，
  并对暂存的 TS 跑 `tsc --noEmit` 全项目类型门禁；之后跑 `scripts/check-changeset.mjs`——
  **暂存区动了会影响扩展产物的文件（源码 / 入口 / manifest 权限等）就要求带一条新 changeset，
  否则阻止提交**（白名单减法判定，纯文档 / 配置 / `website/` 放行；见下「版本与发布」）。
- **commit-msg**（`.husky/commit-msg`）：`commitlint` 校验提交信息。
- **聚合 `pnpm check`**：本地大改动 / 合并前跑 lint + typecheck + test:run + build，本地即过，别等推上去才发现。

## 版本与发布

用 [changesets](https://github.com/changesets/changesets) 管版本号与 CHANGELOG（本项目 `private`，
**不发 npm**；扩展产物走 Chrome Web Store / Firefox AMO）：

1. 改完功能：`pnpm changeset` 记录变更（选 major/minor/patch + 写说明）。
   - **粒度**：一个功能 / 一个用户可见改动一条，跟着 commit 走；不要攒到发布前。
   - **门禁**：pre-commit 会拦——只要这次 commit 动了会影响扩展产物的文件（默认都要 changeset，
     纯文档 / 配置 / `website/` 等白名单放行）。trivial 改动用 `CHANGESET_SKIP=1 git commit`
     只跳过本门禁；`git commit --no-verify` 跳过全部 hook，慎用。
2. 准备发版：`pnpm version-packages` 应用 changeset → 升顶层 `version` + **自动同步 `manifest.version`**
   （`scripts/sync-manifest-version.mjs`）+ 更新 `CHANGELOG.md`
3. `pnpm build` 产出扩展包，按 [`PUBLISH_GUIDE.md`](PUBLISH_GUIDE.md) 上架
