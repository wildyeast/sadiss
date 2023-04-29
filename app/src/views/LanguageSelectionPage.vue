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
        <ion-item
          class="ionic-bg-secondary w-[80%]"
          lines="none">
          <ion-label
            position="stacked"
            color="light"
            >Please select a language
          </ion-label>
          <ion-select
            v-model="mainStore.selectedLanguage"
            class="w-full text-white">
            <ion-select-option
              v-for="lang of mainStore.availableLanguages"
              :key="lang.iso"
              :value="lang.iso"
              >{{ lang.lang }}
            </ion-select-option>
          </ion-select>
        </ion-item>
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
import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  useIonRouter,
  IonItem,
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonButtons,
  IonBackButton
} from '@ionic/vue'
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
