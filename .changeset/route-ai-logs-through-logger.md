---
"ext-helper": patch
---

修复隐私泄露：生产构建不再把 AI 原始响应（含已安装扩展清单与访问的 URL）打印到浏览器控制台。相关调试日志已统一改走生产环境静默的 logger，并加 lint 规则防止裸 console.log 再混入打包产物。
