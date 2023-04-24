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
        <div class="flex items-center gap-4">
          <div class="flex flex-col items-center gap-4 text-white">
            <h1 class="text-3xl">{{ mainStore.performanceName }}</h1>
            <h2 class="text-2xl">{{ mainStore.roleName }}</h2>
          </div>
          <ion-button
            class="button"
            @click="changeOutputLatencyOffset(-0.01)"
            >-
          </ion-button>
          <div class="w-28 text-center text-3xl font-bold">{{ outputLatencyOffset }}s</div>
          <ion-button
            class="button"
            @click="changeOutputLatencyOffset(0.01)"
            >+
          </ion-button>
        </div>
        <ion-button
          @click="ionRouter.navigate('/main', 'forward', 'push')"
          class="ionic-rounded-full ionic-bg-secondary h-[100px] w-[100px] text-2xl">
          Done
        </ion-button>
      </BasePage>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonToolbar, useIonRouter, IonButton, IonButtons, IonBackButton } from '@ionic/vue'
import { ref } from 'vue'
import BasePage from '@/components/BasePage.vue'
import { usePlayer } from '@/composables/usePlayer'
import { useMainStore } from '@/stores/MainStore'
const mainStore = useMainStore()

// Router
const ionRouter = useIonRouter()

const { setOutputLatencyOffset } = usePlayer()

const outputLatencyOffset = ref(0)
const changeOutputLatencyOffset = (changeBy: number) => {
  const newOffset = (outputLatencyOffset.value + changeBy).toFixed(2)
  outputLatencyOffset.value = +newOffset
  setOutputLatencyOffset(outputLatencyOffset.value)
}
</script>
