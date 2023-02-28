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
        <div class="flex flex-col items-center gap-4">
          <h1 class="text-3xl">{{ performanceName }}</h1>
          <h2 class="text-2xl">{{ roleName }}</h2>
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

const performanceName = ref('Performance Name')
const roleName = ref('Sepp Hiaslbauer')

const availableLanguages = ref()
const selectedLanguage = ref()

onMounted(async () => {
  // Load performance name from preferences
  const performanceNameResult = await Preferences.get({ key: 'performanceName' })
  if (performanceNameResult.value) {
    performanceName.value = performanceNameResult.value
  }

  // Load role name from preferences
  const roleNameResult = await Preferences.get({ key: 'roleName' })
  if (roleNameResult.value) {
    roleName.value = roleNameResult.value
  }

  // Load available languages from preferences
  const availableLanguagesResult = await Preferences.get({ key: 'availableLanguages' })
  if (availableLanguagesResult.value) {
    availableLanguages.value = await JSON.parse(availableLanguagesResult.value)
  }

  // Load default language from preferences
  const defaultLanguageResult = await Preferences.get({ key: 'defaultLang' })
  if (defaultLanguageResult.value) {
    const availableLang = availableLanguages.value.find((lang: AvailableLanguage) => lang.iso === defaultLanguageResult.value)
    if (availableLang) {
      selectedLanguage.value = availableLang
    }
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

interface AvailableLanguage {
  iso: string
  lang: string
}
</script>
