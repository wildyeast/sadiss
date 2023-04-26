<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button></ion-back-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <BasePage>
        <div class="flex flex-col items-center gap-4 text-white">
          <h1 class="text-3xl">{{ mainStore.performanceName }}</h1>
          <h2 class="text-2xl">{{ mainStore.roleName }}</h2>
        </div>
        <div class="flex w-full justify-center gap-10">
          <button
            @mousedown="startChangingOutputLatencyOffset(-0.01)"
            @mouseup="stopChangingOutputLatencyOffset()">
            <img
              src="../../public/assets/arrow-left.svg"
              class="h-[40px]" />
          </button>
          <div class="w-28 text-center text-4xl font-bold text-highlight">{{ outputLatencyOffset }}s</div>
          <button
            @mousedown="startChangingOutputLatencyOffset(0.01)"
            @mouseup="stopChangingOutputLatencyOffset()">
            <img
              src="../../public/assets/arrow-right.svg"
              class="h-[40px]" />
          </button>
        </div>
        <p>
          You should be hearing a regular click while this screen is displayed. To adjust the timing of your device to match
          others mor closely click the arrows above. Your device will remember this setting.
        </p>
        <button
          @click="goForward()"
          class="h-[80px] w-[80px] text-2xl">
          <img src="../../public/assets/button-next.svg" />
        </button>
      </BasePage>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonToolbar, useIonRouter, IonButton, IonButtons, IonBackButton } from '@ionic/vue'
import { onMounted, ref } from 'vue'
import BasePage from '@/components/BasePage.vue'
import { usePlayer } from '@/composables/usePlayer'
import { useMainStore } from '@/stores/MainStore'
import { Preferences } from '@capacitor/preferences'
import { useMCorp } from '@/composables/useMCorp'
import { useWebsocketConnection } from '@/composables/useWebsocketConnection'

const ionRouter = useIonRouter()
const mainStore = useMainStore()
const { establishWebsocketConnection } = useWebsocketConnection()
const { initializeMCorp } = useMCorp()
const { setOutputLatencyOffset } = usePlayer()

const outputLatencyOffset = ref(0)
const maxOutputLatencyOffset = 0.6
const minOutputLatencyOffset = -0.6
const changeOutputLatencyOffset = (changeBy: number) => {
  const newOffset = outputLatencyOffset.value + changeBy
  if (newOffset > maxOutputLatencyOffset || newOffset < minOutputLatencyOffset) {
    return
  }
  outputLatencyOffset.value = +newOffset.toFixed(2)
  setOutputLatencyOffset(outputLatencyOffset.value)
}

let intervalId: ReturnType<typeof setInterval>
function startChangingOutputLatencyOffset(changeBy: number) {
  changeOutputLatencyOffset(changeBy)
  intervalId = setInterval(() => {
    changeOutputLatencyOffset(changeBy)
  }, 100)
}

function stopChangingOutputLatencyOffset() {
  clearInterval(intervalId)
}

const goForward = async () => {
  await Preferences.set({ key: 'outputLatencyOffset', value: outputLatencyOffset.value.toString() })
  if (mainStore.availableLanguages.length && mainStore.availableLanguages.length > 1) {
    ionRouter.navigate('/language-selection', 'forward', 'push')
  } else {
    ionRouter.navigate('/main', 'forward', 'push')
  }
}

onMounted(async () => {
  const offsetResult = await Preferences.get({ key: 'outputLatencyOffset' })
  if (offsetResult.value) {
    outputLatencyOffset.value = +offsetResult.value
  }
  await initializeMCorp()
  establishWebsocketConnection()
})
</script>
