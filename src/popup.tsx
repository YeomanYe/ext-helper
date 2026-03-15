import * as React from "react"
import { createRoot } from "react-dom/client"
import { PopupPage } from "@/components/PopupPage"
import "@/styles/globals.css"

function App() {
  return <PopupPage />
}

const container = document.getElementById("root")
if (container) {
  const root = createRoot(container)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
