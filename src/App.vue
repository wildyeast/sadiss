<template>
  <ion-app class="scanner-hide">
    <ion-router-outlet />
  </ion-app>
  <div class="scanner-ui">
    <!-- QR Scanner Interface -->
  </div>
</template>

<script lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'App',
  components: {
    IonApp,
    IonRouterOutlet
  }
})
</script>

<style>
body,
html {
  --background: #111;
  --ion-background-color: #111;
  @apply bg-primary;
}

body.scanner-active {
  --background: transparent;
  --ion-background-color: transparent;
}

.scanner-ui {
  display: none;
}

.scanner-hide {
  visibility: visible;
}

body.qrscanner {
  background-color: transparent;
}

body.qrscanner .scanner-ui {
  display: block;
}

body.qrscanner .scanner-hide {
  visibility: hidden;
}
</style>
