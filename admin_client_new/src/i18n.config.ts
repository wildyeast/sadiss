import { createI18n } from "vue-i18n"

const i18n = createI18n({
  locale: "en",
  fallbackLocale: "en",
  globalInjection: true,
  messages: {
    en: {
      add_track: "Add Track",
      created_by: "Created by",
      dashboard: "Dashboard",
      login: "Login",
      performances: "Performances",
      track: "Track | Tracks",
      waveforms: {
        sine: "Sine",
        square: "Square",
        sawtooth: "Sawtooth",
        triangle: "Triangle",
      },
    },
  },
})

export default i18n
