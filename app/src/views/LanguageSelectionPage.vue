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
      <div class="flex h-full w-full flex-col items-center justify-around gap-8 bg-primary">
        <div class="flex flex-col items-center gap-4 text-white">
          <h1 class="text-3xl">{{ mainStore.performanceName }}</h1>
          <h2 class="text-2xl">{{ mainStore.roleName }}</h2>
        </div>
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
        <ion-button
          @click="ionRouter.navigate('/main', 'forward', 'push')"
          :disabled="!mainStore.selectedLanguage"
          class="ionic-rounded-full ionic-bg-secondary h-[100px] w-[100px] text-2xl">
          Done
        </ion-button>
      </div>
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
  IonButton,
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonButtons,
  IonBackButton
} from '@ionic/vue'
import { watch } from 'vue'
import { useMainStore } from '@/stores/MainStore'
const mainStore = useMainStore()

// Router
const ionRouter = useIonRouter()

watch(
  () => mainStore.selectedLanguage,
  async (value) => {
    mainStore.selectedLanguage = value
  }
)
</script>
