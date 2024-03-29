// https://github.com/capacitor-community/barcode-scanner
import { BarcodeScanner } from '@capacitor-community/barcode-scanner'
import { useMainStore } from '@/stores/MainStore'
import { QrCodeScanResult } from '@/types/types'

export function useBarcodeScanner() {
  const startScan = async () => {
    await BarcodeScanner.checkPermission({ force: true })

    BarcodeScanner.hideBackground()

    const result = await BarcodeScanner.startScan()

    if (result.hasContent) {
      return result.content
    }
  }

  const stopScan = () => {
    BarcodeScanner.stopScan()
  }

  const processScanResult = (result: QrCodeScanResult) => {
    const mainStore = useMainStore()

    const performanceNameResult = result.performanceName
    if (performanceNameResult) {
      mainStore.performanceName = performanceNameResult
    }

    const choirIdResult = result.choirId
    if (choirIdResult !== undefined && !Number.isNaN(+choirIdResult)) {
      mainStore.choirId = +choirIdResult
    }

    const roleNameResult = result.roleName
    if (roleNameResult) {
      mainStore.roleName = roleNameResult
    }

    const defaultLangResult = result.defaultLang
    if (defaultLangResult) {
      mainStore.defaultLang = defaultLangResult
    }

    const ttsLangsResult = result.tts
    if (ttsLangsResult) {
      const foundDefaultLang = ttsLangsResult.find((lang) => lang.iso === defaultLangResult)
      mainStore.availableLanguages = ttsLangsResult
      mainStore.selectedLanguage = foundDefaultLang || ttsLangsResult[0]
    }

    const expertModeResult = result.expertMode
    if (expertModeResult) {
      mainStore.expertMode = expertModeResult
    }

    const performanceIdResult = result.performanceId
    if (performanceIdResult) {
      mainStore.performanceId = performanceIdResult
    }

    const wsUrlResult = result.wsUrl
    if (wsUrlResult) {
      mainStore.wsUrl = wsUrlResult
    }
  }

  return {
    startScan,
    stopScan,
    processScanResult
  }
}
