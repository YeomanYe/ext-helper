import * as React from "react"
import { createRoot } from "react-dom/client"
import { PopupPage } from "~src/components/PopupPage"
import { applyStoredThemeDom } from "~src/utils/theme"
import "~src/styles/globals.css"

applyStoredThemeDom()

export default function App() {
  return <PopupPage />
}

// Vite preview mounts here. Plasmo mounts the default export into "__plasmo".
const container = document.getElementById("root")
if (container) {
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
