import { createI18n } from "vue-i18n"

const i18n = createI18n({
  locale: "en",
  fallbackLocale: "en",
  globalInjection: true,
  messages: {
    en: {
      created_by: "Created by",
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
