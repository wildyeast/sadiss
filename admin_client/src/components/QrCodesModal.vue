<script setup lang="ts">
import { nextTick, ref } from 'vue'
import BaseModal from './BaseModal.vue'
import { useQrCodeGenerator } from '@/composables/useQrCodeGenerator'
import QrcodeVue from 'qrcode.vue'
import { useModal } from '@/composables/useModal'

const { closeModal, openModal, modal } = useModal()
defineExpose({
  openModal,
  closeModal
})

const props = defineProps<{
  performanceId: string
  performanceName: string
}>()

const { generateQrCodes, qrCodeData, setQrCodeContainerRef, downloadPartialQrCodes } = useQrCodeGenerator()

const voiceCount = ref(1)
const voiceNames = ref([''])
const ttsLangs = ref('')
const defaultLanguage = ref('')
const expertMode = ref(false)

const qrCodeContainer = ref()

const handleGenerateQrCodes = async () => {
  await generateQrCodes(
    voiceCount.value,
    voiceNames.value,
    props.performanceName,
    expertMode.value,
    props.performanceId,
    ttsLangs.value,
    defaultLanguage.value
  )
  setQrCodeContainerRef(qrCodeContainer.value)
  await nextTick()
  await downloadPartialQrCodes()

  closeModal()
}
</script>
<template>
  <BaseModal
    ref="modal"
    @close-modal="closeModal">
    <form
      @submit.prevent="handleGenerateQrCodes"
      class="flex flex-col gap-4 p-4">
      <h1 class="text-center text-3xl font-bold text-primary">Generate QR Codes</h1>
      <div class="mt-8 flex flex-row justify-between p-2">
        <div>Voice count</div>
        <input
          v-model="voiceCount"
          type="number"
          class="w-3/4" />
      </div>
      <div
        v-for="voice in voiceCount"
        class="flex flex-row justify-between p-2">
        <div>Name for voice {{ voice - 1 }}</div>
        <input
          v-model="voiceNames[voice - 1]"
          class="w-3/4" />
      </div>
      <div class="mt-8 flex flex-row justify-between p-2">
        <div>TTS languages</div>
        <input
          v-model="ttsLangs"
          type="text"
          class="w-3/4" />
      </div>
      <div class="mt-8 flex flex-row justify-between p-2">
        <div>Default lang</div>
        <input
          v-model="defaultLanguage"
          type="text"
          class="w-3/4" />
      </div>
      <!-- Expert mode checkbox -->
      <div class="flex flex-col">
        <div>Expert mode</div>
        <input
          type="checkbox"
          v-model="expertMode"
          class="w-3/4" />
      </div>
      <button
        type="submit"
        formmethod="dialog"
        class="text-white rounded-sm bg-primary p-2">
        Generate
      </button>
    </form>
    <!-- QR Codes (not visible to user) -->
    <div
      class="flex flex-wrap gap-2"
      style="display: none">
      <div v-for="qrCode of qrCodeData">
        <div ref="qrCodeContainer">
          <qrcode-vue
            :value="JSON.stringify(qrCode)"
            :size="200"
            :render-as="'svg'"
            level="H" />
        </div>
      </div>
    </div>
  </BaseModal>
</template>
