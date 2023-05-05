<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <BasePage>
        <div class="flex w-full flex-1 flex-col items-center justify-around">
          <PerformanceInformation />
          <div class="flex w-full flex-col items-center gap-4">
            <img
              src="../../public/assets/globe.svg"
              class="h-[44px]" />
            <div
              class="flex max-h-[110px] w-full flex-col rounded-xl border-2 border-highlight py-2 text-xl"
              :class="{ 'overflow-scroll': mainStore.availableLanguages.length > 3 }">
              <button
                v-for="(lang, index) in mainStore.availableLanguages"
                :key="index"
                @click="mainStore.selectedLanguage = lang">
                <span
                  v-if="lang.iso === mainStore.selectedLanguage.iso"
                  class="text-highlight"
                  >&gt;&gt; {{ lang.lang }} &lt;&lt;
                </span>
                <span v-else>{{ lang.lang }}</span>
              </button>
            </div>
          </div>
          <button
            @click="ionRouter.navigate('/main', 'forward', 'push')"
            :disabled="!mainStore.selectedLanguage"
            class="h-[80px] w-[80px] text-2xl">
            <img src="../../public/assets/button-next.svg" />
          </button>
        </div>
      </BasePage>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonPage, useIonRouter } from '@ionic/vue'
import { watch } from 'vue'
import { useMainStore } from '@/stores/MainStore'
import BasePage from '@/components/BasePage.vue'
import PerformanceInformation from '@/components/PerformanceInformation.vue'
import { usePlayer } from '@/composables/usePlayer'

const mainStore = useMainStore()
const ionRouter = useIonRouter()
const { setTtsLanguage } = usePlayer()

watch(
  () => mainStore.selectedLanguage,
  async (value) => {
    mainStore.selectedLanguage = value
    setTtsLanguage(mainStore.selectedLanguage.iso)
  },
  { immediate: true }
)
</script>
