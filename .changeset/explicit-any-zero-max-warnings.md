---
"ext-helper": patch
---

内部类型安全收尾：清除源码里剩余的 explicit-any（debounce 工具函数改用更严的泛型约束、规则引擎测试改用真实的条件类型），并把 lint 门禁收紧为 `--max-warnings=0`（本地与 pre-commit 一致），杜绝新的 lint warning 混入。无用户可见行为变化。
