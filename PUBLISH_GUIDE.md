# Ext Helper v2.0.0 发布指南

## 更新内容

### Manifest 更新
- **Name**: "Ext Helper - AI Extension Manager"
- **Version**: 2.0.0
- **Description**: AI-powered extension manager: discover extensions for any website, get recommendations powered by Google's built-in AI model or your custom model. Manage, group, and automate extensions with smart site-awareness.

### 新的宣传图
- 路径: `promotion-assets/generated/ext-helper-site-discovery-1280x800.png`
- 尺寸: 1280×800
- 展示: 网站发现浮层、推荐功能、拖放功能

## 发布步骤

### 1. 构建扩展包

```bash
pnpm build
```

这将生成 `build/chrome-mv3-prod/` 目录，包含完整的扩展文件。

### 2. Chrome Web Store 发布

**访问地址**: https://chrome.google.com/webstore/devconsole

#### 步骤:
1. 登录 Google 开发者账号
2. 选择 "Ext Helper" 扩展（或创建新列表）
3. 进入 **Package** 标签，上传新版本的扩展包（zip 格式）
4. 进入 **Store listing** 标签，更新以下内容：
   - **Short description** (132 字符以内):
     ```
     AI-powered extension manager with site discovery, smart recommendations & automation.
     ```
   - **Description** (完整描述):
     ```
     Ext Helper is your intelligent extension manager powered by AI.

     ## Key Features

     ✨ **AI-Powered Site Discovery**
     - Automatically discover which installed extensions work on the current website
     - Floating panel shows smart recommendations right where you need them
     - No sign-in required, 3 lookups per day free

     🤖 **Flexible AI Models**
     - Use Google's built-in AI model for instant recommendations
     - Connect your own custom AI model for personalized suggestions
     - Choose what works best for your workflow

     🎯 **Smart Extension Management**
     - Enable/disable extensions with one click
     - Organize extensions into groups
     - Create rules to auto-manage extensions by website or schedule
     - Undo/redo any changes
     - Binary search to find problematic extensions

     ⚡ **Efficient Workflow**
     - Drag the discovery panel anywhere on the page
     - See installed extensions and cloud recommendations together
     - Full import/export of configurations

     Perfect for developers, QA, and power users who manage many extensions.
     ```
   - **Screenshots** (上传所有宣传图):
     - 上传 `promotion-assets/generated/ext-helper-site-discovery-1280x800.png`
     - 可选：添加其他 1280×800 的功能截图

   - **Icon** (128×128): `assets/icon.png` 或已有的 icon
5. 点击 **Submit for review**

### 3. Microsoft Edge 应用商店发布

**访问地址**: https://partner.microsoft.com/en-us/dashboard/microsoftedge/overview

#### 步骤:
1. 登录 Microsoft Partner Center 账号
2. 选择 "Ext Helper" 扩展（或创建新列表）
3. 进入 **Package** 标签，上传新版本的扩展包（zip 格式）
4. 进入 **Listings** 标签，更新以下内容：
   - **Name**: Ext Helper - AI Extension Manager
   - **Short description**:
     ```
     AI-powered extension manager with site discovery, smart recommendations & automation.
     ```
   - **Description** (同 Chrome Web Store)
   - **Images** (上传宣传图):
     - 上传 `promotion-assets/generated/ext-helper-site-discovery-1280x800.png` (主图)
     - 1280×800 PNG 或 JPG 格式
   - **Icon**: 128×128 PNG

5. 点击 **Submit**

## 关键信息

### 功能亮点 (用于审查和营销)

✅ **Site Discovery** - 浮层面板显示当前网站的已安装扩展和推荐
✅ **Cloud Recommendations** - 云端推荐引擎，3次/天免费
✅ **AI Integration** - 支持 Google 内置大模型和自定义大模型
✅ **Smart Automation** - 基于网站和时间的自动化规则
✅ **Extension Groups** - 按场景分组管理扩展
✅ **Undo/Redo** - 完整的操作历史
✅ **Privacy** - 无需登录，匿名推荐

### 审查提示

- 强调 **AI 驱动**和 **网站感知**的核心竞争力
- 提及隐私保护（无需登录）
- 突出开发者和高级用户的使用场景
- 展示截图清晰展示新的浮层发现面板

## 发布后验证

1. 等待审查（通常 24-48 小时）
2. 审查通过后，检查：
   - Chrome Web Store: https://chromewebstore.google.com/detail/ext-helper-ai-extension
   - Edge Add-ons: https://microsoftedge.microsoft.com/addons/detail/ext-helper-ai-extension
3. 确认描述、截图、版本号都正确显示

## 版本更新记录

**v2.0.0 (2026-06-07)**
- 新增: 网站发现浮层（Site Discovery）
- 新增: 云端扩展推荐（支持3次/天免费）
- 新增: AI 快速分组建议
- 新增: 深色/浅色/跟随系统主题切换
- 改进: 全新 punk 轻色视觉设计
