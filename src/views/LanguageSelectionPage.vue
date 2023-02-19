<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>SADISS</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="flex h-full w-full flex-col items-center justify-center gap-8">
        <ion-item class="w-[80%]">
          <ion-label>Language:</ion-label>
          <ion-select
            v-model="ttsLanguage"
            class="w-full">
            <ion-select-option value="en-US">English</ion-select-option>
            <ion-select-option value="de-DE">Deutsch</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-button
          @click="ionRouter.navigate('/main', 'forward', 'replace')"
          :disabled="!ttsLanguage"
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
  IonTitle,
  IonToolbar,
  useIonRouter,
  IonItem,
  IonButton,
  IonSelect,
  IonSelectOption,
  IonLabel
} from '@ionic/vue'
import { ref, watch } from 'vue'
import { Preferences } from '@capacitor/preferences'

// Router
const ionRouter = useIonRouter()

const ttsLanguage = ref()

watch(
  () => ttsLanguage.value,
  async (value) => {
    await Preferences.set({
      key: 'lang',
      value: value
    })
  }
)
</script>
