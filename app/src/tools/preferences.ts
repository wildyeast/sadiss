import { Preferences } from '@capacitor/preferences'

export const setPreference = async (key: PreferenceKey, value: string) => await Preferences.set({ key, value })
export const getPreference = async (key: PreferenceKey) => await Preferences.get({ key })

type PreferenceKey =
  | 'availableLanguages'
  | 'roleName'
  | 'choirId'
  | 'performanceName'
  | 'defaultLang'
  | 'selectedLanguage'
  | 'lastScanTimestamp'
  | 'qrCodeInvalidationCheckedThisSession'
  | 'expertMode'
