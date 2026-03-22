import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import { fileURLToPath, URL } from "node:url"

export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      fastRefresh: true  // React Fast Refresh 始终启用
    })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "~src": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  // 开发服务器配置（支持 HMR）
  server: {
    port: 4173,
    strictPort: false,
    host: "0.0.0.0",  // 支持内网访问
    hmr: {
      overlay: true
    }
  },
  // 预览配置
  preview: {
    port: 4173,
    host: "0.0.0.0"
  },
  build: {
    outDir: "dist-web"
  }
}))
