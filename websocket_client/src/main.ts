import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')

declare global {
  interface Window {
    Pusher: any,
    Echo: any
  }
}
