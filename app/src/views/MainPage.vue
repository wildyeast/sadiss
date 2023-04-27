<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button :hidden="isRegistered"></ion-back-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <BasePage>
        <PerformanceInformation />

        <div class="h-[60vw] w-[60vw]">
          <div
            v-if="isRegistered"
            @click="register"
            class="flex h-full w-full items-center justify-center rounded-full bg-highlight text-2xl font-bold">
            <p class="text-4xl text-primary">Active</p>
          </div>
          <ion-button
            v-else-if="wasRegisteredThisSession"
            @click="register"
            class="ionic-rounded-full h-full w-full rounded-full border-4 border-danger">
            <span class="text-4xl text-danger">Rejoin</span>
          </ion-button>
        </div>
        <p
          v-if="!isRegistered && wasRegisteredThisSession"
          class="text-sm text-danger">
          Your connection seems to be broken. Please rejoin by pressing the Rejoin button above.
        </p>
        <p class="text-sm">To leave the performance or scan a different code you have to quit and re-start the app.</p>

        <p class="text-white">v1.1.0</p>
      </BasePage>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonToolbar, IonButton, IonButtons, IonBackButton, useIonRouter } from '@ionic/vue'
import { watch, onUnmounted, onMounted, ref } from 'vue'
import { usePlayer } from '../composables/usePlayer'
import { Capacitor } from '@capacitor/core'
import { KeepAwake } from '@capacitor-community/keep-awake'
import { NavigationBar } from '@hugotomazi/capacitor-navigation-bar'
import { useMainStore } from '@/stores/MainStore'
import { useWebsocketConnection } from '@/composables/useWebsocketConnection'
import BasePage from '@/components/BasePage.vue'
import PerformanceInformation from '@/components/PerformanceInformation.vue'

const mainStore = useMainStore()
const { establishWebsocketConnection, isRegistered } = useWebsocketConnection()

const { setTtsLanguage } = usePlayer()

const register = () => {
  setTtsLanguage(mainStore.selectedLanguage)
  establishWebsocketConnection()
}

onMounted(() => {
  register()
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
    wasRegisteredThisSession.value = true
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
  }
)
</script>
