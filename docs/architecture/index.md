# 架构域

代码怎么组织、逻辑放哪层、状态怎么流转。

| 文件 | 内容 |
|---|---|
| [rules.md](rules.md) | 架构硬规则总纲：分层 / 单向数据流 / Repository / dual-runtime / 状态不可变 |

**背景参考（非规则，归档原文）**：
- [完整架构文档](../_archive/legacy/architecture.md) — 464 行详述（技术决策 / 数据流图 / 各子系统）
- [模块设计文档](../_archive/legacy/modules.md) — 各功能模块详细设计

> 扩展运行时相关的架构约束（dual-runtime / 跨浏览器）在 [extension 域](../extension/rules.md)。
