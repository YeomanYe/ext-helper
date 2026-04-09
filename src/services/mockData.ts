// Mock data for development mode
import type { Extension, Group } from "@/types"
import type { Rule } from "@/rules/types"

// ============================================================
// Mock Extensions
// ============================================================

const EXTENSION_NAMES = [
  "AdBlocker Ultimate",
  "Dark Reader",
  "LastPass Password Manager",
  "Grammarly",
  "Octotree",
  "JSON Viewer",
  "WhatFont",
  "ColorZilla",
  "Lighthouse",
  "React Developer Tools",
  "Vue.js devtools",
  "Tampermonkey",
  "uBlock Origin",
  "Enhanced GitHub",
  "Awesome Screenshot",
  "1Password",
  "Wappalyzer",
  "Momentum",
  "Honey",
  "Evernote Web Clipper",
]

const EXTENSION_DESCRIPTIONS = [
  "Block all ads and trackers on websites",
  "Dark mode for every website",
  "Secure password manager",
  "AI-powered writing assistant",
  "GitHub code tree viewer",
  "Format and syntax highlight JSON",
  "Identify fonts on web pages",
  "Advanced color picker",
  "Website auditing and performance testing tool",
  "React debugging tool",
  "Vue.js debugging",
  "Userscript manager",
  "Efficient ad blocker",
  "Adds useful features to GitHub",
  "Screen capture and annotation",
  "Password manager",
  "Technology profiler",
  "Personal dashboard",
  "Automatic coupon finder",
  "Save web pages to Evernote",
]

const HOMEPAGE_URLS = [
  "https://example.com",
  "https://darkreader.org",
  "https://lastpass.com",
  "https://grammarly.com",
  "https://github.com",
  null,
  null,
  "https://colorzilla.com",
  "https://developers.google.com/lighthouse",
  null,
  null,
  "https://tampermonkey.net",
  "https://ublock.org",
  null,
  null,
  "https://1password.com",
  "https://wappalyzer.com",
  "https://momentumdash.com",
  "https://joinhoney.com",
  "https://evernote.com",
]

const PERMISSION_POOLS: string[][] = [
  ["storage", "tabs"],
  ["storage", "activeTab"],
  ["storage", "activeTab", "tabs"],
  ["storage"],
]

const HOST_PERMISSION_POOLS: string[][] = [
  ["<all_urls>"],
  ["https://*.google.com/*", "https://*.github.com/*"],
  ["https://*.example.com/*"],
  [],
]

const INSTALL_TYPES: Extension["installType"][] = [
  "normal",
  "normal",
  "normal",
  "development",
  "sideload",
]

function createMockExtension(index: number, overrides?: Partial<Extension>): Extension {
  const nameIndex = (index - 1) % EXTENSION_NAMES.length
  const major = ((index * 3) % 16) + 1
  const minor = (index * 7) % 130
  const patch = (index * 13) % 120
  const enabled = index % 3 !== 0

  return {
    id: `ext-${index}`,
    name: EXTENSION_NAMES[nameIndex],
    description: EXTENSION_DESCRIPTIONS[nameIndex],
    version: `${major}.${minor}.${patch}`,
    versionName: index % 5 === 0 ? `${major}.${minor} beta` : null,
    enabled,
    iconUrl: null,
    type: "extension",
    permissions: PERMISSION_POOLS[index % PERMISSION_POOLS.length],
    hostPermissions: HOST_PERMISSION_POOLS[index % HOST_PERMISSION_POOLS.length],
    installType: INSTALL_TYPES[index % INSTALL_TYPES.length],
    mayEnable: index !== 7,
    mayDisable: index !== 4,
    disabledReason: !enabled && index % 5 === 0 ? "permissions_increase" : null,
    offlineEnabled: index % 4 === 0,
    optionsUrl: index === 2 || index === 12 ? "options.html" : null,
    homepageUrl: HOMEPAGE_URLS[nameIndex] ?? null,
    updateUrl: index % 3 === 0 ? "https://clients2.google.com/service/update2/crx" : null,
    ...overrides,
  }
}

export const MOCK_EXTENSIONS: Extension[] = Array.from({ length: 50 }, (_, i) =>
  createMockExtension(i + 1)
)

// ============================================================
// Mock Groups
// ============================================================

export const MOCK_GROUPS: Group[] = [
  {
    id: "group-1",
    name: "\u5DE5\u4F5C",
    color: "#3B82F6",
    icon: "briefcase",
    extensionIds: ["ext-1", "ext-2", "ext-3", "ext-4"],
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 2,
    isExpanded: true,
    order: 0,
  },
  {
    id: "group-2",
    name: "\u5F00\u53D1\u5DE5\u5177",
    color: "#22C55E",
    icon: "code",
    extensionIds: ["ext-5", "ext-6", "ext-9", "ext-10", "ext-11", "ext-12"],
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000,
    isExpanded: true,
    order: 1,
  },
  {
    id: "group-3",
    name: "\u8BBE\u8BA1",
    color: "#8B5CF6",
    icon: "palette",
    extensionIds: ["ext-7", "ext-8", "ext-15"],
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now(),
    isExpanded: false,
    order: 2,
  },
]

// Check if running in browser extension or dev mode
export function isDevMode(): boolean {
  return typeof window !== "undefined" && !window.location.href.includes("chrome-extension")
}

// ============================================================
// Mock Rules
// ============================================================

const RULE_NAMES = [
  "\u5DE5\u4F5C\u65E5\u5F00\u53D1\u6A21\u5F0F",
  "GitHub\u589E\u5F3A",
  "\u591C\u95F4\u6A21\u5F0F",
  "\u5468\u672B\u7981\u7528\u5DE5\u4F5C\u6269\u5C55",
  "\u793E\u4EA4\u5A92\u4F53\u4E13\u6CE8",
  "\u89C6\u9891\u7F51\u7AD9\u53BB\u5E7F\u544A",
  "\u5728\u7EBF\u8D2D\u7269\u6BD4\u4EF7",
  "\u65B0\u95FB\u9605\u8BFB\u6A21\u5F0F",
  "\u5F00\u53D1\u73AF\u5883\u9694\u79BB",
  "\u5BC6\u7801\u5B89\u5168\u7BA1\u7406",
  "\u4F1A\u8BAE\u4E13\u6CE8\u6A21\u5F0F",
  "\u8BBE\u8BA1\u7075\u611F",
  "\u65E9\u95F4\u65B0\u95FB",
  "\u9879\u76EE\u7BA1\u7406",
  "\u9690\u79C1\u4FDD\u62A4",
  "\u5C4F\u5E55\u622A\u56FE\u5DE5\u5177",
  "\u4EE3\u7801\u7247\u6BB5\u7BA1\u7406",
  "\u7F51\u9875\u65E0\u969C\u788D",
  "\u952E\u76D8\u5BFC\u822A\u589E\u5F3A",
  "\u6807\u7B7E\u9875\u7BA1\u7406",
]

const RULE_DESCRIPTIONS = [
  "\u6839\u636E\u7F51\u7AD9\u548C\u65F6\u95F4\u81EA\u52A8\u5207\u6362\u6269\u5C55\u72B6\u6001",
  "\u5728\u76EE\u6807\u7F51\u7AD9\u542F\u7528\u76F8\u5173\u589E\u5F3A\u63D2\u4EF6",
  "\u5E2E\u52A9\u5728\u56FA\u5B9A\u573A\u666F\u4E0B\u4FDD\u6301\u4E13\u6CE8",
  "\u81EA\u52A8\u7BA1\u7406\u5DE5\u4F5C\u548C\u5A31\u4E50\u6269\u5C55\u7EC4\u5408",
  "\u51CF\u5C11\u9875\u9762\u5E72\u6270\u5E76\u63D0\u5347\u6D4F\u89C8\u6548\u7387",
  "\u4E3A\u5E38\u7528\u7F51\u7AD9\u542F\u7528\u4E13\u7528\u8F85\u52A9\u5DE5\u5177",
  "\u5728\u7279\u5B9A\u65F6\u6BB5\u5207\u6362\u5230\u5408\u9002\u7684\u6269\u5C55\u96C6",
  "\u6309\u7167\u8BBF\u95EE\u57DF\u540D\u7EC4\u5408\u81EA\u52A8\u5904\u7406\u6269\u5C55",
  "\u4E3A\u5F00\u53D1\u3001\u8BBE\u8BA1\u548C\u529E\u516C\u573A\u666F\u4F18\u5316\u73AF\u5883",
  "\u6A21\u62DF\u771F\u5B9E\u7528\u6237\u7684\u81EA\u52A8\u5316\u89C4\u5219\u914D\u7F6E",
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
  ["x.com", "twitter.com", "facebook.com", "instagram.com"],
]

const RULE_SCHEDULE_POOLS = [
  null,
  { days: [1, 2, 3, 4, 5], startTime: "09:00", endTime: "18:00" },
  { days: [1, 2, 3, 4, 5], startTime: "14:00", endTime: "16:00" },
  { days: [0, 6], startTime: "00:00", endTime: "23:59" },
  { days: [0, 1, 2, 3, 4, 5, 6], startTime: "22:00", endTime: "23:59" },
  { days: [0, 1, 2, 3, 4, 5, 6], startTime: "07:00", endTime: "09:00" },
]

const randomPick = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)]

const randomSample = <T>(items: T[], count: number): T[] => {
  const pool = [...items]
  const result: T[] = []
  while (pool.length > 0 && result.length < count) {
    const index = Math.floor(Math.random() * pool.length)
    result.push(pool.splice(index, 1)[0])
  }
  return result
}

function createMockActions(_ruleIndex: number) {
  const useGroupAction = Math.random() > 0.5
  if (useGroupAction) {
    const groups = randomSample(MOCK_GROUPS, 1 + Math.floor(Math.random() * 2))
    return groups.map((group) => ({
      type: Math.random() > 0.5 ? ("enableGroup" as const) : ("disableGroup" as const),
      targetId: group.id,
    }))
  }

  const extensions = randomSample(MOCK_EXTENSIONS, 1 + Math.floor(Math.random() * 3))
  return extensions.map((extension) => ({
    type: Math.random() > 0.5 ? ("enableExtension" as const) : ("disableExtension" as const),
    targetId: extension.id,
  }))
}

function createMockRule(ruleIndex: number): Rule {
  const domainPool = randomPick(RULE_DOMAIN_POOLS)
  const domainCount = Math.min(
    domainPool.length,
    1 + Math.floor(Math.random() * Math.min(3, domainPool.length))
  )
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
        schedule,
      },
    ],
    conditionOperator: Math.random() > 0.5 ? "AND" : "OR",
    actions: createMockActions(ruleIndex),
    priority: ruleIndex + 1,
    createdAt,
    updatedAt: createdAt + Math.floor(Math.random() * 86400000 * 3),
    triggerCount: Math.floor(Math.random() * 500),
  }
}

export const MOCK_RULES: Rule[] = Array.from({ length: 50 }, (_, index) => createMockRule(index))
