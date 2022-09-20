<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Blank</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Blank</ion-title>
        </ion-toolbar>
      </ion-header>

      <div id="container">
        <ion-button @click="startTest">Test</ion-button>
        <p>{{ currentTime }}</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton } from '@ionic/vue';
import { ref } from 'vue';
import { TextToSpeech } from '@capacitor-community/text-to-speech'

let motion: { pos: number } = { pos: 0 }
const currentTime = ref(-1)
const startTest = async () => {
  await initializeMCorp()

  // Play continuous sine wave
  const audioContext = new AudioContext()
  const osc = audioContext.createOscillator()
  osc.frequency.setValueAtTime(440, audioContext.currentTime)

  const gain = audioContext.createGain()
  gain.gain.setValueAtTime(0.2, audioContext.currentTime)

  osc.connect(gain)
  gain.connect(audioContext.destination)
  osc.start()

  // Play text to speech

  let lastSpokenNumber = -1
  setInterval(async () => {
    currentTime.value = Math.floor(motion.pos % 10)
    if (lastSpokenNumber !== currentTime.value) {
      if (currentTime.value % 2 === 0) {
        // const utterance = new SpeechSynthesisUtterance(currentTime.value.toString())
        // window.speechSynthesis.speak(utterance)

        await TextToSpeech.speak({
          text: currentTime.value.toString(),
          lang: 'en-US',
          rate: 1.0,
          pitch: 1.0,
          volume: 1.0,
          category: 'ambient',
        })

        lastSpokenNumber = currentTime.value
      }
      osc.frequency.setValueAtTime(440 + currentTime.value * 12, audioContext.currentTime)
    }
  }, 10)


}

const initializeMCorp = async () => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line
  const mCorpApp = MCorp.app('8844095860530063641', { anon: true })
  mCorpApp.run = function () {
    motion = mCorpApp.motions['shared']
  }
  mCorpApp.init()
}
</script>

<style scoped>
#container {
  text-align: center;

  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

#container strong {
  font-size: 20px;
  line-height: 26px;
}

#container p {
  font-size: 16px;
  line-height: 22px;

  color: #8c8c8c;

  margin: 0;
}

#container a {
  text-decoration: none;
}
</style>
