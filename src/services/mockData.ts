// Mock data for development mode
import type { Extension, Group } from "@/types"

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
    description: "",
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
