// https://github.com/capacitor-community/barcode-scanner
// Changes in AndroidManifest.xml already implemented
// Changes in Info.plist (iOS) NOT yet implemented
// Click on the link above for more information

import { BarcodeScanner } from '@capacitor-community/barcode-scanner'

export function useBarcodeScanner() {
  const startScan = async () => {
    // Check camera permission
    // This is just a simple example, check out the better checks below
    const permissionResult = await BarcodeScanner.checkPermission({ force: true })
    console.log('Permission granted: ', permissionResult.granted)

    // make background of WebView transparent
    // note: if you are using ionic this might not be enough, check below
    BarcodeScanner.hideBackground()

    const result = await BarcodeScanner.startScan() // start scanning and wait for a result

    // if the result has content
    if (result.hasContent) {
      console.log(result.content) // log the raw scanned content
      console.log('End of scan.')
      return result.content
    }

    console.log('End of scan.')
  }

  return {
    startScan
  }
}
