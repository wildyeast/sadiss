import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Button from './components/Button.vue'
import Modal from './components/Modal.vue'
import './style.css'

const app = createApp(App).use(router)
app.component('Button', Button)
app.component('Modal', Modal)
app.mount('#app')
