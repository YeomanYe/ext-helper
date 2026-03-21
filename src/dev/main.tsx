import * as React from "react"
import { createRoot } from "react-dom/client"
import { PopupPage } from "~src/components/PopupPage"
import "~src/styles/globals.css"

function App() {
  return (
    <React.StrictMode>
      <PopupPage />
    </React.StrictMode>
  )
}

const container = document.getElementById("root")
if (container) {
  const root = createRoot(container)
  root.render(<App />)
}
