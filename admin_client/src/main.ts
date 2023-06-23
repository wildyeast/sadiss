import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Button from './components/Button.vue'
import Modal from './components/Modal.vue'
import './style.css'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faTrash,
  faPlusCircle,
  faPlus,
  faPlay,
  faPause,
  faPlayCircle,
  faStopCircle,
  faRepeat,
  faForwardFast,
  faQrcode,
  faUser,
  faUserGroup,
  faEdit,
  faPeopleGroup,
  faMusic,
  faComments
} from '@fortawesome/free-solid-svg-icons'
import { createPinia } from 'pinia'

library.add(
  faTrash,
  faPlusCircle,
  faPlus,
  faPlay,
  faPause,
  faPlayCircle,
  faStopCircle,
  faRepeat,
  faForwardFast,
  faQrcode,
  faUser,
  faUserGroup,
  faEdit,
  faPeopleGroup,
  faMusic,
  faComments
)

const pinia = createPinia()

const app = createApp(App).use(router).use(pinia)
app.component('Button', Button)
app.component('Modal', Modal)
app.component('font-awesome-icon', FontAwesomeIcon)
app.mount('#app')
