import { defineConfig } from "vite"

export default defineConfig({
  base: process.env.VITE_BASE_URL || "/",
  build: {
    outDir: "dist",
    assetsInlineLimit: 4096,
  },
})
