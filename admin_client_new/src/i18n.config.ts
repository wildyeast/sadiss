import { createI18n } from "vue-i18n"

const i18n = createI18n({
  locale: "en",
  fallbackLocale: "en",
  globalInjection: true,
  messages: {
    en: {
      add_track: "Add Track",
      confirm_delete_track: "Are you sure you want to delete this track?",
      created_by: "Created by",
      dashboard: "Dashboard",
      languages: "Languages",
      login: "Login",
      no_file_selected: "No file selected",
      notes: "Comments",
      partial_file: "Partials File",
      partial_file_upload_button: "Select Partials File",
      performances: "Performances",
      text_to_speech: "Text to Speech",
      title: "Title",
      track: "Track | Tracks",
      tts_file_upload_button: "Select Text to Speech File",
      voice: "Voice",
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
