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
      <div class="flex h-full w-full flex-col items-center justify-center gap-8 bg-primary">
        <ion-item
          class="ionic-bg-secondary w-[80%]"
          lines="none">
          <ion-label
            position="stacked"
            color="light"
            >Please select a language
          </ion-label>
          <ion-select
            v-model="selectedLanguage"
            class="w-full text-white">
            <ion-select-option
              v-for="lang of availableLanguages"
              :key="lang.iso"
              :value="lang.iso"
              >{{ lang.lang }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        <ion-button
          @click="ionRouter.navigate('/main', 'forward', 'push')"
          :disabled="!selectedLanguage"
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
import { ref, watch, onMounted } from 'vue'
import { Preferences } from '@capacitor/preferences'

// Router
const ionRouter = useIonRouter()

const availableLanguages = ref([{ iso: 'de-DE', lang: 'Deutsch' }])
const selectedLanguage = ref()

onMounted(async () => {
  try {
    const availableLanguagesResult = await Preferences.get({ key: 'availableLanguages' })
    if (availableLanguagesResult.value) {
      const parsed = await JSON.parse(availableLanguagesResult.value)
      console.log('Parsed json: ', parsed)
      availableLanguages.value = await JSON.parse(availableLanguagesResult.value)
    }
  } catch (err) {
    console.log('Failed mounting lang selection page.')
  }
})

watch(
  () => selectedLanguage.value,
  async (value) => {
    await Preferences.set({
      key: 'selectedLanguage',
      value: value
    })
  }
)
</script>
