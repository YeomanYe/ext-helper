# Changesets

本目录由 [changesets](https://github.com/changesets/changesets) 管理本扩展的**版本号与
CHANGELOG**。本项目 `private`，**不发布到 npm**（扩展产物走 Chrome Web Store / Firefox AMO）。

用法见 [`../CONTRIBUTING.md`](../CONTRIBUTING.md) 的「版本与发布」段：

1. `pnpm changeset` — 记录一条变更（选 bump 级别 + 写说明）
2. `pnpm version-packages` — 应用 changeset → 升 `package.json` 版本 + 更新 `CHANGELOG.md`
3. `pnpm build` + 按 `PUBLISH_GUIDE.md` 上架

> 注意：`changeset version` 只改顶层 `version`；`manifest.version` 由 `version-packages` 脚本里的
> `scripts/sync-manifest-version.mjs` 自动同步。
