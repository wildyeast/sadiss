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
        <PerformanceInformation />
        <div class="mt-10 flex w-full flex-1 flex-col items-center gap-6">
          <img
            src="../../public/assets/globe.svg"
            class="h-[40px]" />
          <div
            class="flex max-h-[100px] w-full flex-col rounded-xl border-2 border-highlight py-2"
            :class="{ 'overflow-scroll': mainStore.availableLanguages.length > 3 }">
            <button
              v-for="(lang, index) in mainStore.availableLanguages"
              :key="index"
              @click="mainStore.selectedLanguage = lang.iso"
              :class="{ 'text-highlight': lang.iso === mainStore.selectedLanguage }">
              {{ lang.lang }}
            </button>
          </div>
        </div>
        <button
          @click="ionRouter.navigate('/main', 'forward', 'push')"
          :disabled="!mainStore.selectedLanguage"
          class="h-[80px] w-[80px] text-2xl">
          <img src="../../public/assets/button-next.svg" />
        </button>
      </BasePage>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonToolbar, useIonRouter, IonButtons, IonBackButton } from '@ionic/vue'
import { watch } from 'vue'
import { useMainStore } from '@/stores/MainStore'
import BasePage from '@/components/BasePage.vue'
import PerformanceInformation from '@/components/PerformanceInformation.vue'

const mainStore = useMainStore()
const ionRouter = useIonRouter()

watch(
  () => mainStore.selectedLanguage,
  async (value) => {
    mainStore.selectedLanguage = value
  }
)
</script>
