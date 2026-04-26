export const config = {
  siteUrl: import.meta.env.VITE_SITE_URL ?? "https://yeomanye.github.io/ext-helper",
  githubUrl: import.meta.env.VITE_GITHUB_URL ?? "https://github.com/YeomanYe/ext-helper",
  chromeStoreUrl:
    import.meta.env.VITE_CHROME_STORE_URL ??
    "https://chromewebstore.google.com/detail/ext-helper/bnoomkhaemojkbmdmniifkijjaiiomfl",
  firefoxAddonUrl: import.meta.env.VITE_FIREFOX_ADDON_URL ?? "#",
  edgeAddonUrl: import.meta.env.VITE_EDGE_ADDON_URL ?? "#",
} as const
