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
      <div class="flex h-full flex-col items-center justify-center gap-10 bg-primary">
        <div class="flex items-center gap-4">
          <ion-button
            class="button"
            @click="changeOutputLatencyOffset(-0.01)"
            >-
          </ion-button>
          <div class="w-20 text-center text-3xl font-bold">{{ outputLatencyOffset }}</div>
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
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonToolbar, useIonRouter, IonButton, IonButtons, IonBackButton } from '@ionic/vue'
import { ref, watch, onMounted } from 'vue'
import { getPreference, setPreference } from '@/tools/preferences'
import { usePlayer } from '@/composables/usePlayer'

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
