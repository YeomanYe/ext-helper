const REQUEST_TYPE = "EXT_HELPER_ICON_TO_DATA_URL"
const RESPONSE_TYPE = "EXT_HELPER_ICON_DATA_URL"

function imageToDataUrl(iconUrl) {
  return new Promise((resolve, reject) => {
    if (!iconUrl || typeof iconUrl !== "string") {
      reject(new Error("Missing icon URL"))
      return
    }

    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        canvas.width = image.naturalWidth || 32
        canvas.height = image.naturalHeight || 32
        const context = canvas.getContext("2d")
        if (!context) {
          reject(new Error("Canvas unavailable"))
          return
        }
        context.drawImage(image, 0, 0)
        resolve(canvas.toDataURL("image/png"))
      } catch (error) {
        reject(error)
      }
    }
    image.onerror = () => reject(new Error("Icon image failed to load"))
    image.src = iconUrl
  })
}

window.addEventListener("message", async (event) => {
  if (event.source !== window.parent) return

  const message = event.data || {}
  if (message.type !== REQUEST_TYPE) return

  try {
    const dataUrl = await imageToDataUrl(message.iconUrl)
    window.parent.postMessage(
      {
        type: RESPONSE_TYPE,
        id: message.id,
        dataUrl,
      },
      event.origin
    )
  } catch (error) {
    window.parent.postMessage(
      {
        type: RESPONSE_TYPE,
        id: message.id,
        error: error instanceof Error ? error.message : "Icon conversion failed",
      },
      event.origin
    )
  }
})
