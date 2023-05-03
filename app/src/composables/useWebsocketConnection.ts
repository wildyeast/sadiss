import { useMainStore } from '@/stores/MainStore'
import { onUnmounted, ref } from 'vue'
import { usePlayer } from './usePlayer'
const { handleChunkData, setOffset, stopPlayback, setStartTime, setTrackSettings } = usePlayer()

const isRegistered = ref(false)
export function useWebsocketConnection() {
  const mainStore = useMainStore()
  const ws = ref<WebSocket>()

  let attemptingToRegister = false
  const establishWebsocketConnection = async () => {
    if (attemptingToRegister || isRegistered.value) return
    attemptingToRegister = true
    while (!mainStore.wsUrl) {
      console.log('waiting for ws url')
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
    console.log('ws url: ', mainStore.wsUrl)
    ws.value = new WebSocket(mainStore.wsUrl)

    ws.value.onopen = function () {
      isRegistered.value = true
      attemptingToRegister = false
      this.send(
        JSON.stringify({
          message: 'clientInfo',
          clientId: mainStore.choirId,
          ttsLang: mainStore.selectedLanguage,
          performanceId: mainStore.performanceId
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
      console.error(JSON.stringify(error))
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
      if (data.chunk && Object.keys(data.chunk).length) {
        handleChunkData(data.chunk)
      }
    }

    onUnmounted(() => {
      ws.value?.close()
    })
  }

  return { establishWebsocketConnection, attemptingToRegister, isRegistered }
}
