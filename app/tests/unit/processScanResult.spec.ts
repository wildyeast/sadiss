import { createTestingPinia } from '@pinia/testing'
import { useBarcodeScanner } from '@/composables/useBarcodeScanner'
import { useMainStore } from '@/stores/MainStore'

const { processScanResult } = useBarcodeScanner()

createTestingPinia()

const mainStore = useMainStore()

describe('processScanResult', () => {
  it('should update the performance name in mainStore when provided in the scan result', () => {
    const result = { performanceName: 'My Performance', performanceId: '456' }
    processScanResult(result)
    expect(mainStore.performanceName).toBe(result.performanceName)
  })

  it('should update the choirId in mainStore when provided in the scan result', () => {
    const result = { performanceName: 'My Performance', choirId: '123', performanceId: '456' }
    processScanResult(result)
    expect(mainStore.choirId).toBe(+result.choirId)
  })

  it('should update the role name in mainStore when provided in the scan result', () => {
    const result = { performanceName: 'My Performance', roleName: 'My Role', performanceId: '456' }
    processScanResult(result)
    expect(mainStore.roleName).toBe(result.roleName)
  })

  it('should update the default TTS language in mainStore when provided in the scan result', () => {
    const result = { performanceName: 'My Performance', defaultLang: 'en', performanceId: '456' }
    processScanResult(result)
    expect(mainStore.defaultLang).toBe(result.defaultLang)
  })

  it('should update the available TTS languages in mainStore when provided in the scan result', () => {
    const result = {
      performanceName: 'My Performance',
      performanceId: '456',
      tts: [
        { iso: 'en', lang: 'English' },
        { iso: 'fr', lang: 'French' }
      ]
    }
    processScanResult(result)
    expect(mainStore.availableLanguages).toEqual(result.tts)
  })

  it('should update the selected TTS language in mainStore to the default language when both are provided in the scan result', () => {
    const result = {
      performanceName: 'My Performance',
      tts: [
        { iso: 'en', lang: 'English' },
        { iso: 'fr', lang: 'French' }
      ],
      defaultLang: 'fr',
      performanceId: '456'
    }
    processScanResult(result)
    expect(mainStore.selectedLanguage).toBe(result.defaultLang)
  })

  it('should update the selected TTS language in mainStore to the first available language when no default language is provided in the scan result', () => {
    const result = {
      performanceName: 'My Performance',
      tts: [
        { iso: 'en', lang: 'English' },
        { iso: 'fr', lang: 'French' }
      ],
      performanceId: '456'
    }
    processScanResult(result)
    expect(mainStore.selectedLanguage).toBe(result.tts[0].iso)
  })

  it('should update the expert mode to be true in mainStore when provided in the scan result', () => {
    const result = { performanceName: 'My Performance', expertMode: 'true', performanceId: '456' }
    processScanResult(result)
    expect(mainStore.expertMode).toBe(true)
  })

  it('should update the expert mode to be false in mainStore when provided in the scan result', () => {
    const result = { performanceName: 'My Performance', expertMode: 'false', performanceId: '456' }
    processScanResult(result)
    expect(mainStore.expertMode).toBe(false)
  })

  it('should update the performanceId in mainStore when provided in the scan result', () => {
    const result = { performanceName: 'My Performance', performanceId: '123' }
    processScanResult(result)
    expect(mainStore.performanceId).toBe(+result.performanceId)
  })
})