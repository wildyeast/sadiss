<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <BasePage>
        <div class="flex flex-1 flex-col items-center justify-around">
          <PerformanceInformation :text-color-danger="!isRegistered && wasRegisteredThisSession" />
          <div class="h-[60vw] w-[60vw]">
            <div
              v-if="isRegistered"
              class="pulse flex h-full w-full items-center justify-center rounded-full bg-highlight text-2xl font-bold">
              <p class="text-4xl text-primary">Active</p>
            </div>
            <ion-button
              v-else-if="wasRegisteredThisSession"
              @click="register"
              class="ionic-rounded-full h-full w-full rounded-full border-2 border-danger">
              <span class="text-4xl text-danger">Rejoin</span>
            </ion-button>
            <div
              v-else
              class="flex h-full items-center justify-center">
              <ion-spinner
                name="circular"
                class="scale-[200%] text-highlight" />
            </div>
          </div>
          <div>
            <p
              v-if="!isRegistered && wasRegisteredThisSession"
              class="mb-4 text-center text-sm text-danger">
              Your connection seems to be broken. Please rejoin by pressing the Rejoin button above.
            </p>
            <p
              v-else
              class="text-center text-sm text-tertiary">
              To leave the performance or scan a different code you have to quit and re-start the app.
            </p>
          </div>
        </div>

        <p class="text-sm">v1.2.0</p>
      </BasePage>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage, IonButton, useBackButton, IonSpinner } from '@ionic/vue'
import { watch, onUnmounted, onMounted, ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { KeepAwake } from '@capacitor-community/keep-awake'
import { NavigationBar } from '@hugotomazi/capacitor-navigation-bar'
import { useMainStore } from '@/stores/MainStore'
import { useWebsocketConnection } from '@/composables/useWebsocketConnection'
import BasePage from '@/components/BasePage.vue'
import PerformanceInformation from '@/components/PerformanceInformation.vue'
import { useMCorp } from '@/composables/useMCorp'

const { initializeMCorp } = useMCorp()
const mainStore = useMainStore()
const { establishWebsocketConnection, isRegistered } = useWebsocketConnection()

const register = () => {
  establishWebsocketConnection()
}

// Disable hardware and NavigationBar back button on Android
useBackButton(10, () => {
  return
})

onMounted(async () => {
  if (!mainStore.expertMode) {
    await initializeMCorp()
    register()
  }
})

onUnmounted(async () => {
  if (Capacitor.getPlatform() === 'android') {
    await NavigationBar.show()
  }
})

const wasRegisteredThisSession = ref(false)
// Enable/Disable KeepAwake and Android Navigation Bar depending on registration status
watch(
  () => isRegistered.value,
  async (value) => {
    if (value) {
      wasRegisteredThisSession.value = true
    }

    try {
      if (Capacitor.getPlatform() !== 'web') {
        if (value) {
          await KeepAwake.keepAwake()
        } else {
          await KeepAwake.allowSleep()
        }
      }
      if (Capacitor.getPlatform() === 'android') {
        if (value) {
          await NavigationBar.hide()
        } else {
          await NavigationBar.show()
        }
      }
    } catch (error) {
      console.log(error)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.pulse {
  animation-name: pulse;
  animation-duration: 2s;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}
@keyframes pulse {
  0% {
    @apply opacity-25;
  }
  50% {
    @apply opacity-100;
  }
  100% {
    @apply opacity-25;
  }
}
</style>
