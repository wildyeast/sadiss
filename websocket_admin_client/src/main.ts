import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import VueAxios from 'vue-axios'
import Button from './components/Button.vue'
import Modal from './components/Modal.vue'
import './style.css'

const app = createApp(App).use(router)
app.use(VueAxios, axios)
app.component('Button', Button)
app.component('Modal', Modal)
app.provide('axios', app.config.globalProperties.axios)  // provide 'axios'
app.mount('#app')
