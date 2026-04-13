/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL: string
  readonly VITE_GITHUB_URL: string
  readonly VITE_CHROME_STORE_URL: string
  readonly VITE_FIREFOX_ADDON_URL: string
  readonly VITE_EDGE_ADDON_URL: string
  readonly VITE_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
