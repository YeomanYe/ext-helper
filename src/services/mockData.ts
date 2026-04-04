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

export const MOCK_RULES: Rule[] = [
  {
    id: "rule-1",
    name: "工作日开发模式",
    description: "工作日启用开发工具扩展",
    enabled: true,
    conditionGroups: [
      {
        id: "cg-1",
        domains: ["*"],
        matchMode: "wildcard",
        schedule: {
          days: [1, 2, 3, 4, 5],
          startTime: "09:00",
          endTime: "18:00"
        }
      }
    ],
    conditionOperator: "AND",
    actions: [
      { type: "enableGroup", targetId: "group-2" }
    ],
    priority: 1,
    createdAt: Date.now() - 86400000 * 30,
    updatedAt: Date.now() - 86400000 * 5,
    triggerCount: 156
  },
  {
    id: "rule-2",
    name: "GitHub增强",
    description: "访问GitHub时启用增强插件",
    enabled: true,
    conditionGroups: [
      {
        id: "cg-2",
        domains: ["github.com", "github.io"],
        matchMode: "wildcard",
        schedule: null
      }
    ],
    conditionOperator: "AND",
    actions: [
      { type: "enableExtension", targetId: "ext-5" },
      { type: "enableExtension", targetId: "ext-14" }
    ],
    priority: 2,
    createdAt: Date.now() - 86400000 * 25,
    updatedAt: Date.now() - 86400000 * 10,
    triggerCount: 89
  },
  {
    id: "rule-3",
    name: "夜间模式",
    description: "晚上10点后启用暗色主题扩展",
    enabled: true,
    conditionGroups: [
      {
        id: "cg-3",
        domains: ["*"],
        matchMode: "wildcard",
        schedule: {
          days: [0, 1, 2, 3, 4, 5, 6],
          startTime: "22:00",
          endTime: "23:59"
        }
      }
    ],
    conditionOperator: "AND",
    actions: [
      { type: "enableExtension", targetId: "ext-2" }
    ],
    priority: 3,
    createdAt: Date.now() - 86400000 * 20,
    updatedAt: Date.now() - 86400000 * 3,
    triggerCount: 234
  },
  {
    id: "rule-4",
    name: "周末禁用工作扩展",
    description: "周末自动关闭工作相关扩展",
    enabled: false,
    conditionGroups: [
      {
        id: "cg-4",
        domains: ["*"],
        matchMode: "wildcard",
        schedule: {
          days: [0, 6],
          startTime: "00:00",
          endTime: "23:59"
        }
      }
    ],
    conditionOperator: "AND",
    actions: [
      { type: "disableGroup", targetId: "group-1" }
    ],
    priority: 4,
    createdAt: Date.now() - 86400000 * 15,
    updatedAt: Date.now() - 86400000 * 2,
    triggerCount: 42
  },
  {
    id: "rule-5",
    name: "社交媒体专注",
    description: "使用社交媒体时隐藏干扰",
    enabled: true,
    conditionGroups: [
      {
        id: "cg-5",
        domains: ["twitter.com", "x.com", "facebook.com", "instagram.com", "weibo.com"],
        matchMode: "wildcard",
        schedule: null
      }
    ],
    conditionOperator: "OR",
    actions: [
      { type: "disableGroup", targetId: "group-2" }
    ],
    priority: 5,
    createdAt: Date.now() - 86400000 * 12,
    updatedAt: Date.now() - 86400000,
    triggerCount: 67
  },
  {
    id: "rule-6",
    name: "视频网站去广告",
    description: "访问视频网站时启用广告拦截",
    enabled: true,
    conditionGroups: [
      {
        id: "cg-6",
        domains: ["youtube.com", "bilibili.com", "twitch.tv", "vimeo.com"],
        matchMode: "wildcard",
        schedule: null
      }
    ],
    conditionOperator: "AND",
    actions: [
      { type: "enableExtension", targetId: "ext-1" },
      { type: "enableExtension", targetId: "ext-13" }
    ],
    priority: 6,
    createdAt: Date.now() - 86400000 * 10,
    updatedAt: Date.now() - 86400000 * 4,
    triggerCount: 312
  },
  {
    id: "rule-7",
    name: "在线购物比价",
    description: "购物网站显示价格历史",
    enabled: true,
    conditionGroups: [
      {
        id: "cg-7",
        domains: ["amazon.com", "jd.com", "taobao.com", "ebay.com"],
        matchMode: "wildcard",
        schedule: null
      }
    ],
    conditionOperator: "OR",
    actions: [
      { type: "disableExtension", targetId: "ext-19" }
    ],
    priority: 7,
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now() - 86400000 * 2,
    triggerCount: 45
  },
  {
    id: "rule-8",
    name: "新闻阅读模式",
    description: "阅读新闻时启用阅读器模式",
    enabled: false,
    conditionGroups: [
      {
        id: "cg-8",
        domains: ["news.ycombinator.com", "reddit.com", "medium.com"],
        matchMode: "wildcard",
        schedule: null
      }
    ],
    conditionOperator: "AND",
    actions: [
      { type: "enableExtension", targetId: "ext-6" }
    ],
    priority: 8,
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000,
    triggerCount: 23
  },
  {
    id: "rule-9",
    name: "开发环境隔离",
    description: "本地开发时禁用所有扩展",
    enabled: true,
    conditionGroups: [
      {
        id: "cg-9",
        domains: ["localhost", "127.0.0.1"],
        matchMode: "wildcard",
        schedule: null
      }
    ],
    conditionOperator: "OR",
    actions: [
      { type: "disableGroup", targetId: "group-1" },
      { type: "disableGroup", targetId: "group-2" },
      { type: "disableGroup", targetId: "group-3" }
    ],
    priority: 9,
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 3,
    triggerCount: 178
  },
  {
    id: "rule-10",
    name: "密码安全管理",
    description: "金融网站启用密码管理器",
    enabled: true,
    conditionGroups: [
      {
        id: "cg-10",
        domains: ["bank.com", "paypal.com", "alipay.com", "wechatpay.com"],
        matchMode: "wildcard",
        schedule: null
      }
    ],
    conditionOperator: "OR",
    actions: [
      { type: "enableExtension", targetId: "ext-16" },
      { type: "enableExtension", targetId: "ext-32" }
    ],
    priority: 10,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 2,
    triggerCount: 56
  },
  {
    id: "rule-11",
    name: "会议专注模式",
    description: "工作时间禁用娱乐扩展",
    enabled: true,
    conditionGroups: [
      {
        id: "cg-11",
        domains: ["*"],
        matchMode: "wildcard",
        schedule: {
          days: [1, 2, 3, 4, 5],
          startTime: "14:00",
          endTime: "16:00"
        }
      }
    ],
    conditionOperator: "AND",
    actions: [
      { type: "disableExtension", targetId: "ext-18" },
      { type: "disableExtension", targetId: "ext-28" }
    ],
    priority: 11,
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000,
    triggerCount: 89
  },
  {
    id: "rule-12",
    name: "设计灵感",
    description: "设计网站启用设计工具",
    enabled: true,
    conditionGroups: [
      {
        id: "cg-12",
        domains: ["dribbble.com", "behance.net", "pinterest.com", "花瓣网.com"],
        matchMode: "wildcard",
        schedule: null
      }
    ],
    conditionOperator: "OR",
    actions: [
      { type: "enableGroup", targetId: "group-3" }
    ],
    priority: 12,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 2,
    triggerCount: 34
  },
  {
    id: "rule-13",
    name: "早间新闻",
    description: "早上阅读新闻启用相关扩展",
    enabled: false,
    conditionGroups: [
      {
        id: "cg-13",
        domains: ["*"],
        matchMode: "wildcard",
        schedule: {
          days: [1, 2, 3, 4, 5],
          startTime: "07:00",
          endTime: "09:00"
        }
      }
    ],
    conditionOperator: "AND",
    actions: [
      { type: "enableExtension", targetId: "ext-21" }
    ],
    priority: 13,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000,
    triggerCount: 12
  },
  {
    id: "rule-14",
    name: "项目管理",
    description: "项目管理网站启用相关工具",
    enabled: true,
    conditionGroups: [
      {
        id: "cg-14",
        domains: ["trello.com", "notion.so", "asana.com", "jira.com", "linear.app"],
        matchMode: "wildcard",
        schedule: null
      }
    ],
    conditionOperator: "OR",
    actions: [
      { type: "enableExtension", targetId: "ext-22" },
      { type: "enableExtension", targetId: "ext-24" }
    ],
    priority: 14,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000 * 2,
    triggerCount: 67
  },
  {
    id: "rule-15",
    name: "隐私保护",
    description: "高风险网站启用隐私保护",
    enabled: true,
    conditionGroups: [
      {
        id: "cg-15",
        domains: ["*"],
        matchMode: "wildcard",
        schedule: null
      }
    ],
    conditionOperator: "AND",
    actions: [
      { type: "enableExtension", targetId: "ext-33" },
      { type: "enableExtension", targetId: "ext-34" }
    ],
    priority: 15,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    triggerCount: 456
  },
  {
    id: "rule-16",
    name: "屏幕截图工具",
    description: "需要截图时启用截图扩展",
    enabled: false,
    conditionGroups: [
      {
        id: "cg-16",
        domains: ["*"],
        matchMode: "wildcard",
        schedule: {
          days: [0, 1, 2, 3, 4, 5, 6],
          startTime: "00:00",
          endTime: "23:59"
        }
      }
    ],
    conditionOperator: "AND",
    actions: [
      { type: "enableExtension", targetId: "ext-15" },
      { type: "enableExtension", targetId: "ext-43" }
    ],
    priority: 16,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now(),
    triggerCount: 8
  },
  {
    id: "rule-17",
    name: "代码片段管理",
    description: "开发者网站启用代码片段扩展",
    enabled: true,
    conditionGroups: [
      {
        id: "cg-17",
        domains: ["stackoverflow.com", "segmentfault.com", "juejin.im"],
        matchMode: "wildcard",
        schedule: null
      }
    ],
    conditionOperator: "OR",
    actions: [
      { type: "enableExtension", targetId: "ext-41" }
    ],
    priority: 17,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    triggerCount: 19
  },
  {
    id: "rule-18",
    name: "网页无障碍",
    description: "所有网站启用无障碍工具",
    enabled: false,
    conditionGroups: [
      {
        id: "cg-18",
        domains: ["*"],
        matchMode: "wildcard",
        schedule: null
      }
    ],
    conditionOperator: "AND",
    actions: [
      { type: "enableExtension", targetId: "ext-49" }
    ],
    priority: 18,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    triggerCount: 3
  },
  {
    id: "rule-19",
    name: "键盘导航增强",
    description: "常用网站启用Vim键盘导航",
    enabled: true,
    conditionGroups: [
      {
        id: "cg-19",
        domains: ["github.com", "gitlab.com", "gitee.com"],
        matchMode: "wildcard",
        schedule: null
      }
    ],
    conditionOperator: "OR",
    actions: [
      { type: "enableExtension", targetId: "ext-39" }
    ],
    priority: 19,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    triggerCount: 145
  },
  {
    id: "rule-20",
    name: "标签页管理",
    description: "大量标签页时启用标签管理",
    enabled: true,
    conditionGroups: [
      {
        id: "cg-20",
        domains: ["*"],
        matchMode: "wildcard",
        schedule: {
          days: [0, 1, 2, 3, 4, 5, 6],
          startTime: "00:00",
          endTime: "23:59"
        }
      }
    ],
    conditionOperator: "AND",
    actions: [
      { type: "enableExtension", targetId: "ext-35" },
      { type: "enableExtension", targetId: "ext-37" }
    ],
    priority: 20,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    triggerCount: 201
  }
]
