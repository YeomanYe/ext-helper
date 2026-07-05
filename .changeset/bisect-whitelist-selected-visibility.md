---
"ext-helper": patch
---

二分白名单弹窗已选区块可视性修复：max-h 从 6rem 提到 8rem（约 3 行 icon ≈ 33 个），加 `shrink-0` 防止 flex 挤压；顶部新增 `Whitelisted (n)` 计数标签 + 右侧提示 `click icon to remove`，让用户在超过一屏时能明确感知总数并知道要滚动。
