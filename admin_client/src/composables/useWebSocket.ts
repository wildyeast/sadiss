import { ref, onUnmounted } from "vue"

const ws = ref<WebSocket | null>(null)
let attemptingToRegister = false
const isRegistered = ref(false)
const messageListeners = ref<((data: any) => void)[]>([])

export function useWebSocket() {
  const initializeWebsocketConnection = () => {
    if (attemptingToRegister || isRegistered.value) return

    attemptingToRegister = true

    ws.value = new WebSocket(import.meta.env.VITE_APP_WS_URL)

    ws.value.onopen = function () {
      isRegistered.value = true
      attemptingToRegister = false
      this.send(
        JSON.stringify({
          message: "isAdmin",
        })
      )
    }

    ws.value.onclose = () => {
      isRegistered.value = false
      attemptingToRegister = false
      // Handle lost connection
    }

    ws.value.onerror = error => {
      isRegistered.value = false
      attemptingToRegister = false
      console.error("WebSocket error:", JSON.stringify(error))
    }

    // Centralized onmessage handler
    ws.value.onmessage = event => {
      if (!event.data) return

      const data = JSON.parse(event.data)

      for (const listener of messageListeners.value) {
        listener(data)
      }
    }
  }

  // Function to allow components to register their own message handlers
  const addMessageListener = (listener: (data: any) => void) => {
    messageListeners.value.push(listener)

    onUnmounted(() => {
      removeMessageListener(listener)
    })
  }

  const removeMessageListener = (listener: (data: any) => void) => {
    messageListeners.value = messageListeners.value.filter(l => l !== listener)
  }

  const sendMessage = (message: any) => {
    if (ws.value && isRegistered.value) {
      ws.value.send(JSON.stringify(message))
    }
  }

  return {
    ws,
    isRegistered,
    initializeWebsocketConnection,
    addMessageListener,
    sendMessage,
  }
}
