import { defineStore } from 'pinia'
import { ref } from 'vue'
import { AvailableLanguage } from '@/types/types'

export const useMainStore = defineStore('main', () => {
  const availableLanguages = ref<AvailableLanguage[]>([])
  const roleName = ref('')
  const choirId = ref(-1)
  const performanceName = ref('')
  const defaultLang = ref<AvailableLanguage | null>(null)
  const selectedLanguage = ref('en-US')
  const expertMode = ref(false)

  return { availableLanguages, roleName, choirId, performanceName, defaultLang, selectedLanguage, expertMode }
})
