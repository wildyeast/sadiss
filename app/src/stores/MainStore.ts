import { defineStore } from 'pinia'
import { ref } from 'vue'
import { AvailableLanguage } from '@/types/types'

export const useMainStore = defineStore('main', () => {
  const availableLanguages = ref<AvailableLanguage[]>([])
  const roleName = ref('')
  const performanceName = ref('')
  const defaultLang = ref('')
  const selectedLanguage = ref<{ iso: string; lang: string }>({ iso: '', lang: '' })
  const choirId = ref(0)
  const expertMode = ref(false)
  const performanceId = ref(-1)
  const wsUrl = ref('')

  const processing = ref(false)

  // For debugging
  // const availableLanguages = ref<AvailableLanguage[]>([
  //   { iso: 'en-US', lang: 'English' },
  //   { iso: 'de-DE', lang: 'Deutsch' }
  // ])
  // const roleName = ref('DefaultRoleName')
  // const performanceName = ref('DefaultPerformanceName')
  // const defaultLang = ref('en-US')
  // const selectedLanguage = ref('en-US')

  return {
    availableLanguages,
    roleName,
    choirId,
    performanceName,
    defaultLang,
    selectedLanguage,
    expertMode,
    processing,
    performanceId,
    wsUrl
  }
})
