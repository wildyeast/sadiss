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
      <div class="flex flex-row items-center gap-4">
        <label for="voiceCount">Voice count</label>
        <input
          v-model="voiceCount"
          class="w-[60px] rounded-sm border p-1"
          type="number"
          name="voiceCount" />
      </div>
      <div
        v-for="voice in voiceCount"
        class="flex flex-row items-center gap-2">
        <label>Name for voice {{ voice - 1 }}</label>
        <input
          v-model="voiceNames[voice - 1]"
          class="rounded-sm border p-1" />
      </div>

      <hr />

      <!-- TTS languages -->
      <div class="flex flex-row items-center gap-4">
        <label for="ttsLangs">TTS languages</label>
        <input
          v-model="ttsLangs"
          type="text"
          name="ttsLangs"
          class="rounded-sm border p-1"
          placeholder="en-US, de-DE" />
      </div>
      <div
        v-if="ttsLangs.length"
        class="flex flex-row items-center gap-2">
        <div for="defaultLang">Default lang</div>
        <input
          v-model="defaultLanguage"
          type="text"
          name="defaultLang"
          class="rounded-sm border p-1"
          placeholder="en-US" />
      </div>

      <hr />

      <!-- Expert mode checkbox -->
      <div class="flex items-center gap-2">
        <input
          v-model="expertMode"
          type="checkbox"
          id="expertMode"
          name="expertMode"
          class="h-5 w-5 rounded-sm border border-primary p-2" />
        <label for="expertMode">Expert mode</label>
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
