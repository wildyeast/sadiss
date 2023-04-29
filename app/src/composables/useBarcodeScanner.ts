// https://github.com/capacitor-community/barcode-scanner
import { BarcodeScanner } from '@capacitor-community/barcode-scanner'

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

  return {
    startScan,
    stopScan
  }
}
