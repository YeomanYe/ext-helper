export const config = {
  siteUrl: import.meta.env.VITE_SITE_URL ?? "https://YOUR_DOMAIN",
  githubUrl: import.meta.env.VITE_GITHUB_URL ?? "#",
  chromeStoreUrl: import.meta.env.VITE_CHROME_STORE_URL ?? "#",
  firefoxAddonUrl: import.meta.env.VITE_FIREFOX_ADDON_URL ?? "#",
  edgeAddonUrl: import.meta.env.VITE_EDGE_ADDON_URL ?? "#",
} as const
