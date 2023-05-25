import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Button from './components/Button.vue'
import Modal from './components/Modal.vue'
import './style.css'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faTrash, faPlusCircle, faPlus, faPlay, faPause, faPlayCircle, faStopCircle } from '@fortawesome/free-solid-svg-icons'

library.add(faTrash, faPlusCircle, faPlus, faPlay, faPause, faPlayCircle, faStopCircle)

const app = createApp(App).use(router)
app.component('Button', Button)
app.component('Modal', Modal)
app.component('font-awesome-icon', FontAwesomeIcon)
app.mount('#app')
