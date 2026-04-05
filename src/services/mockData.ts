// Mock data for development mode
import type { Extension, Group } from "@/types"
import type { Rule } from "@/rules/types"

export const MOCK_EXTENSIONS: Extension[] = [
  {
    id: "ext-1",
    name: "AdBlocker Ultimate",
    description: "Block all ads and trackers on websites",
    version: "3.8.5",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "tabs"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: "https://example.com"
  },
  {
    id: "ext-2",
    name: "Dark Reader",
    description: "Dark mode for every website",
    version: "4.9.120",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "activeTab"],
    installType: "normal",
    optionsUrl: "options.html",
    homepageUrl: "https://darkreader.org"
  },
  {
    id: "ext-3",
    name: "LastPass Password Manager",
    description: "Secure password manager",
    version: "4.126.0",
    enabled: false,
    iconUrl: null,
    permissions: ["storage", "tabs"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: "https://lastpass.com"
  },
  {
    id: "ext-4",
    name: "Grammarly",
    description: "AI-powered writing assistant",
    version: "14.1100.0",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "activeTab"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: "https://grammarly.com"
  },
  {
    id: "ext-5",
    name: "Octotree",
    description: "GitHub code tree viewer",
    version: "7.0.2",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "activeTab"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: "https://github.com"
  },
  {
    id: "ext-6",
    name: "JSON Viewer",
    description: "Format and syntax highlight JSON",
    version: "2.2.1",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "activeTab"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: null
  },
  {
    id: "ext-7",
    name: "WhatFont",
    description: "Identify fonts on web pages",
    version: "3.1.3",
    enabled: false,
    iconUrl: null,
    permissions: ["storage", "activeTab"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: null
  },
  {
    id: "ext-8",
    name: "ColorZilla",
    description: "Advanced color picker",
    version: "3.9.2",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "activeTab"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: "https://colorzilla.com"
  },
  {
    id: "ext-9",
    name: "Lighthouse",
    description: "Website auditing and performance testing tool",
    version: "11.8.0",
    enabled: false,
    iconUrl: null,
    permissions: ["storage", "activeTab", "tabs"],
    installType: "development",
    optionsUrl: null,
    homepageUrl: "https://developers.google.com/lighthouse"
  },
  {
    id: "ext-10",
    name: "React Developer Tools",
    description: "React debugging tool",
    version: "5.1.0",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "activeTab"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: null
  },
  {
    id: "ext-11",
    name: "Vue.js devtools",
    description: "Vue.js debugging",
    version: "6.6.0",
    enabled: false,
    iconUrl: null,
    permissions: ["storage", "activeTab"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: null
  },
  {
    id: "ext-12",
    name: "Tampermonkey",
    description: "Userscript manager",
    version: "5.1.2",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "tabs", "activeTab"],
    installType: "normal",
    optionsUrl: "options.html",
    homepageUrl: "https://tampermonkey.net"
  },
  {
    id: "ext-13",
    name: "uBlock Origin",
    description: "Efficient ad blocker",
    version: "1.59.0",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "tabs", "activeTab"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: "https://ublock.org"
  },
  {
    id: "ext-14",
    name: "Enhanced GitHub",
    description: "Adds useful features to GitHub",
    version: "1.8.5",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "activeTab"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: null
  },
  {
    id: "ext-15",
    name: "Awesome Screenshot",
    description: "Screen capture and annotation",
    version: "5.1.82",
    enabled: false,
    iconUrl: null,
    permissions: ["storage", "activeTab", "tabs"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: null
  },
  {
    id: "ext-16",
    name: "1Password",
    description: "Password manager",
    version: "2.15.0",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "tabs"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: "https://1password.com"
  },
  {
    id: "ext-17",
    name: "Wappalyzer",
    description: "Technology profiler",
    version: "6.10.70",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "activeTab"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: "https://wappalyzer.com"
  },
  {
    id: "ext-18",
    name: "Momentum",
    description: "Personal dashboard",
    version: "4.5.2",
    enabled: false,
    iconUrl: null,
    permissions: ["storage"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: "https://momentumdash.com"
  },
  {
    id: "ext-19",
    name: "Honey",
    description: "Automatic coupon finder",
    version: "16.5.1",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "activeTab", "tabs"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: "https://joinhoney.com"
  },
  {
    id: "ext-20",
    name: "Evernote Web Clipper",
    description: "Save web pages to Evernote",
    version: "7.34.0",
    enabled: false,
    iconUrl: null,
    permissions: ["storage", "activeTab"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: "https://evernote.com"
  },
  {
    id: "ext-21",
    name: "Pocket",
    description: "Save articles for later",
    version: "3.1.5",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "activeTab"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: "https://getpocket.com"
  },
  {
    id: "ext-22",
    name: "Todoist",
    description: "Task manager",
    version: "9.12.0",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "tabs"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: "https://todoist.com"
  },
  {
    id: "ext-23",
    name: "Trello",
    description: "Project management board",
    version: "2.3.5",
    enabled: false,
    iconUrl: null,
    permissions: ["storage", "activeTab"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: "https://trello.com"
  },
  {
    id: "ext-24",
    name: "Notion Web Clipper",
    description: "Save to Notion",
    version: "0.3.2",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "activeTab"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: "https://notion.so"
  },
  {
    id: "ext-25",
    name: "Google Translate",
    description: "Translate web pages",
    version: "2.0.13",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "activeTab"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: "https://translate.google.com"
  },
  {
    id: "ext-26",
    name: "Zoom Scheduler",
    description: "Schedule Zoom meetings",
    version: "2.1.0",
    enabled: false,
    iconUrl: null,
    permissions: ["storage", "tabs"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: "https://zoom.us"
  },
  {
    id: "ext-27",
    name: "Slack",
    description: "Team communication",
    version: "4.28.0",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "tabs"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: "https://slack.com"
  },
  {
    id: "ext-28",
    name: "Loom",
    description: "Video recording and sharing",
    version: "1.17.0",
    enabled: false,
    iconUrl: null,
    permissions: ["storage", "activeTab", "tabs"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: "https://loom.com"
  },
  {
    id: "ext-29",
    name: "Calendly",
    description: "Meeting scheduling",
    version: "3.2.1",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "activeTab"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: "https://calendly.com"
  },
  {
    id: "ext-30",
    name: "Zotero Connector",
    description: "Save references to Zotero",
    version: "5.0.115",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "activeTab"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: "https://zotero.org"
  },
  {
    id: "ext-31",
    name: "Zotero Connector",
    description: "Save references to Zotero",
    version: "5.0.115",
    enabled: false,
    iconUrl: null,
    permissions: ["storage", "activeTab"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: "https://zotero.org"
  },
  {
    id: "ext-32",
    name: "Bitwarden",
    description: "Open source password manager",
    version: "2024.1.0",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "tabs"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: "https://bitwarden.com"
  },
  {
    id: "ext-33",
    name: "Privacy Badger",
    description: "Privacy protector",
    version: "2024.2.6",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "tabs"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: "https://eff.org"
  },
  {
    id: "ext-34",
    name: "HTTPS Everywhere",
    description: "Encrypt the web",
    version: "2023.5.10",
    enabled: false,
    iconUrl: null,
    permissions: ["storage", "tabs"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: "https://eff.org"
  },
  {
    id: "ext-35",
    name: "Session Buddy",
    description: "Session manager",
    version: "3.6.4",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "tabs"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: null
  },
  {
    id: "ext-36",
    name: "OneTab",
    description: "Reduce tab clutter",
    version: "2.4.5",
    enabled: false,
    iconUrl: null,
    permissions: ["storage", "tabs"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: null
  },
  {
    id: "ext-37",
    name: "Tree Style Tab",
    description: "Tree-style tab bar",
    version: "3.9.23",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "tabs"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: null
  },
  {
    id: "ext-38",
    name: "Tab Wrangler",
    description: "Automatically close inactive tabs",
    version: "8.2.0",
    enabled: false,
    iconUrl: null,
    permissions: ["storage", "tabs"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: null
  },
  {
    id: "ext-39",
    name: "Vimium",
    description: "Keyboard navigation",
    version: "2.0.6",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "tabs"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: null
  },
  {
    id: "ext-40",
    name: "Surfingkeys",
    description: "Map keys for surfing",
    version: "1.1.2",
    enabled: false,
    iconUrl: null,
    permissions: ["storage", "tabs"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: null
  },
  {
    id: "ext-41",
    name: "Markdown Here",
    description: "Write email in Markdown",
    version: "2.14.0",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "activeTab"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: null
  },
  {
    id: "ext-42",
    name: "Copy All URLs",
    description: "Copy all tab URLs",
    version: "2.2.0",
    enabled: false,
    iconUrl: null,
    permissions: ["storage", "tabs"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: null
  },
  {
    id: "ext-43",
    name: "Full Page Screen Capture",
    description: "Capture entire pages",
    version: "1.0.0",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "activeTab"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: null
  },
  {
    id: "ext-44",
    name: "EditThisCookie",
    description: "Cookie manager",
    version: "1.6.3",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "activeTab"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: null
  },
  {
    id: "ext-45",
    name: "User-Agent Switcher",
    description: "Switch user agents",
    version: "2.0.0",
    enabled: false,
    iconUrl: null,
    permissions: ["storage", "tabs"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: null
  },
  {
    id: "ext-46",
    name: "ModHeader",
    description: "Modify HTTP headers",
    version: "3.1.10",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "tabs"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: null
  },
  {
    id: "ext-47",
    name: "Redux DevTools",
    description: "Redux debugging tool",
    version: "3.2.3",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "activeTab"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: null
  },
  {
    id: "ext-48",
    name: "Angular DevTools",
    description: "Angular debugging tool",
    version: "1.0.7",
    enabled: false,
    iconUrl: null,
    permissions: ["storage", "activeTab"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: null
  },
  {
    id: "ext-49",
    name: "Web Developer",
    description: "Web developer toolbar",
    version: "2.0.5",
    enabled: true,
    iconUrl: null,
    permissions: ["storage", "activeTab", "tabs"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: null
  },
  {
    id: "ext-50",
    name: "Stylus",
    description: "Custom website styles",
    version: "1.5.46",
    enabled: false,
    iconUrl: null,
    permissions: ["storage", "activeTab"],
    installType: "normal",
    optionsUrl: null,
    homepageUrl: null
  }
]

export const MOCK_GROUPS: Group[] = [
  {
    id: "group-1",
    name: "工作",
    color: "#3B82F6",
    icon: "briefcase",
    extensionIds: ["ext-1", "ext-2", "ext-3", "ext-4"],
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 2,
    isExpanded: true,
    order: 0
  },
  {
    id: "group-2",
    name: "开发工具",
    color: "#22C55E",
    icon: "code",
    extensionIds: ["ext-5", "ext-6", "ext-9", "ext-10", "ext-11", "ext-12"],
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000,
    isExpanded: true,
    order: 1
  },
  {
    id: "group-3",
    name: "设计",
    color: "#8B5CF6",
    icon: "palette",
    extensionIds: ["ext-7", "ext-8", "ext-15"],
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now(),
    isExpanded: false,
    order: 2
  }
]

// Check if running in browser extension or dev mode
export function isDevMode(): boolean {
  return typeof window !== "undefined" && !window.location.href.includes("chrome-extension")
}

// ============================================================
// Mock Rules
// ============================================================

const RULE_NAMES = [
  "工作日开发模式", "GitHub增强", "夜间模式", "周末禁用工作扩展", "社交媒体专注",
  "视频网站去广告", "在线购物比价", "新闻阅读模式", "开发环境隔离", "密码安全管理",
  "会议专注模式", "设计灵感", "早间新闻", "项目管理", "隐私保护",
  "屏幕截图工具", "代码片段管理", "网页无障碍", "键盘导航增强", "标签页管理"
]

const RULE_DESCRIPTIONS = [
  "根据网站和时间自动切换扩展状态",
  "在目标网站启用相关增强插件",
  "帮助在固定场景下保持专注",
  "自动管理工作和娱乐扩展组合",
  "减少页面干扰并提升浏览效率",
  "为常用网站启用专用辅助工具",
  "在特定时段切换到合适的扩展集",
  "按照访问域名组合自动处理扩展",
  "为开发、设计和办公场景优化环境",
  "模拟真实用户的自动化规则配置"
]

const RULE_DOMAIN_POOLS = [
  ["*"],
  ["github.com", "github.io", "gitlab.com"],
  ["localhost", "127.0.0.1", "dev.local"],
  ["youtube.com", "bilibili.com", "twitch.tv"],
  ["news.ycombinator.com", "reddit.com", "medium.com"],
  ["amazon.com", "jd.com", "taobao.com", "ebay.com"],
  ["trello.com", "notion.so", "jira.com", "linear.app"],
  ["dribbble.com", "behance.net", "figma.com"],
  ["stackoverflow.com", "juejin.cn", "segmentfault.com"],
  ["x.com", "twitter.com", "facebook.com", "instagram.com"]
]

const RULE_SCHEDULE_POOLS = [
  null,
  { days: [1, 2, 3, 4, 5], startTime: "09:00", endTime: "18:00" },
  { days: [1, 2, 3, 4, 5], startTime: "14:00", endTime: "16:00" },
  { days: [0, 6], startTime: "00:00", endTime: "23:59" },
  { days: [0, 1, 2, 3, 4, 5, 6], startTime: "22:00", endTime: "23:59" },
  { days: [0, 1, 2, 3, 4, 5, 6], startTime: "07:00", endTime: "09:00" }
]

const randomPick = <T,>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)]

const randomSample = <T,>(items: T[], count: number): T[] => {
  const pool = [...items]
  const result: T[] = []
  while (pool.length > 0 && result.length < count) {
    const index = Math.floor(Math.random() * pool.length)
    result.push(pool.splice(index, 1)[0])
  }
  return result
}

function createMockActions(ruleIndex: number) {
  const useGroupAction = Math.random() > 0.5
  if (useGroupAction) {
    const groups = randomSample(MOCK_GROUPS, 1 + Math.floor(Math.random() * 2))
    return groups.map((group) => ({
      type: Math.random() > 0.5 ? "enableGroup" as const : "disableGroup" as const,
      targetId: group.id
    }))
  }

  const extensions = randomSample(MOCK_EXTENSIONS, 1 + Math.floor(Math.random() * 3))
  return extensions.map((extension) => ({
    type: Math.random() > 0.5 ? "enableExtension" as const : "disableExtension" as const,
    targetId: extension.id
  }))
}

function createMockRule(ruleIndex: number): Rule {
  const domainPool = randomPick(RULE_DOMAIN_POOLS)
  const domainCount = Math.min(domainPool.length, 1 + Math.floor(Math.random() * Math.min(3, domainPool.length)))
  const schedule = randomPick(RULE_SCHEDULE_POOLS)
  const createdAt = Date.now() - 86400000 * (50 - ruleIndex)

  return {
    id: `rule-${ruleIndex + 1}`,
    name: `${RULE_NAMES[ruleIndex % RULE_NAMES.length]} ${ruleIndex + 1}`,
    description: RULE_DESCRIPTIONS[ruleIndex % RULE_DESCRIPTIONS.length],
    enabled: Math.random() > 0.25,
    conditionGroups: [
      {
        id: `cg-${ruleIndex + 1}`,
        domains: randomSample(domainPool, domainCount),
        matchMode: Math.random() > 0.2 ? "wildcard" : "contains",
        schedule
      }
    ],
    conditionOperator: Math.random() > 0.5 ? "AND" : "OR",
    actions: createMockActions(ruleIndex),
    priority: ruleIndex + 1,
    createdAt,
    updatedAt: createdAt + Math.floor(Math.random() * 86400000 * 3),
    triggerCount: Math.floor(Math.random() * 500)
  }
}

export const MOCK_RULES: Rule[] = Array.from({ length: 50 }, (_, index) =>
  createMockRule(index)
)
