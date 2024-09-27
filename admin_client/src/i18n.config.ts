import { createI18n } from "vue-i18n"

const i18n = createI18n({
  locale: "en",
  fallbackLocale: "en",
  globalInjection: true,
  messages: {
    en: {
      add_performance: "Add Performance",
      add_selected_tracks: "Add Selected Tracks",
      add_track: "Add Track",
      add_tracks_to_performance: "Add Tracks to Performance",
      choir_mode: "Choir Mode",
      choir_mode_description: "Track is for choirs",
      clients_logged_in: "Clients Logged in",
      confirm_delete_track: "Are you sure you want to delete this track?",
      confirm_delete_track_from_performance:
        "Are you sure you want to delete this track from the performance?",
      created_by: "Created by",
      dashboard: "Dashboard",
      default_language: "Default Language",
      generate_qr_codes: "Generate QR Codes",
      languages: "Languages",
      loading: "Loading...",
      login: "Login",
      name_for_voice: "Name for Voice",
      no_file_selected: "No file selected",
      notes: "Comments",
      partial_file: "Partials File",
      partial_file_upload_button: "Select Partials File",
      performances: "Performances",
      performances_running: "Performances running",
      public_track: "Public Track",
      public_track_description:
        "Publish track to be visible and usable by anyone",
      text_to_speech: "Text to Speech",
      time_sync: "Time Sync",
      time_sync_status: {
        stable: "Stable",
        unsynced: "Unsynced",
      },
      title: "Title",
      track: "Track | Tracks",
      tts_file_upload_button: "Select Text to Speech File",
      tts_languages: "TTS Languages",
      users_logged_in: "Users Logged in",
      voice: "Voice",
      voice_count: "Voice Count",
      waveform: "Waveform",
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