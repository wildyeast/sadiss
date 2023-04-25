import { useMainStore } from '@/stores/MainStore'
import { onUnmounted, ref } from 'vue'
import { usePlayer } from './usePlayer'
const { handleChunkData, setOffset, stopPlayback, setStartTime, setTrackSettings } = usePlayer()

const VUE_APP_WS_SERVER_URL = '192.168.0.87'
const VUE_APP_WS_SERVER_PORT = '443'

const VUE_APP_WS_LIVE_SERVER_URL = 'wss://sadiss.net/ws/'

export function useWebsocketConnection() {
  const mainStore = useMainStore()
  const ws = ref<WebSocket>()

  const isRegistered = ref(false)
  let attemptingToRegister = false
  const establishWebsocketConnection = () => {
    if (attemptingToRegister || isRegistered.value) return
    attemptingToRegister = true

    // ws.value = new WebSocket(`ws://${VUE_APP_WS_SERVER_URL}:${VUE_APP_WS_SERVER_PORT}`)
    ws.value = new WebSocket(VUE_APP_WS_LIVE_SERVER_URL)

    ws.value.onopen = function () {
      isRegistered.value = true
      attemptingToRegister = false
      this.send(
        JSON.stringify({
          message: 'clientInfo',
          clientId: mainStore.choirId,
          ttsLang: mainStore.selectedLanguage
        })
      )
    }

    ws.value.onclose = () => {
      isRegistered.value = false
      attemptingToRegister = false
      stopPlayback()
      // Trying to reconnect here while App is in background does not work.
    }

    ws.value.onerror = (error) => {
      isRegistered.value = false
      attemptingToRegister = false
      stopPlayback()
      console.error(error)
    }

    ws.value.onmessage = (event) => {
      if (!event.data) {
        return
      }

      const data = JSON.parse(event.data)
      console.log('\nReceived message: ', Object.keys(data))

      if (data.start) {
        setOffset()
      }

      if (data.stop) {
        stopPlayback()
        return
      }

      // TODO: This is not ideal, we shouldn't set globalStartTime every time we receive data
      // Is there a way around it though? Clients can join late. Do they need this information?
      setStartTime(data.startTime)
      setTrackSettings(data.waveform, data.ttsRate)
      if (Object.keys(data.chunk)) {
        handleChunkData(data.chunk)
      }
    }

    onUnmounted(() => {
      ws.value?.close()
    })
  }

  return { establishWebsocketConnection, attemptingToRegister, isRegistered }
}
