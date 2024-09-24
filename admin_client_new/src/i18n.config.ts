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
      partial_file: "Partials File",
      partial_file_upload_button: "Select Partials File",
      partial_file_upload_no_file: "No file selected",
      performances: "Performances",
      text_to_speech: "Text to Speech",
      title: "Title",
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
