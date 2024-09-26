import { createApp } from "vue"
import "./style.css"
import App from "./App.vue"
import router from "./router"
import i18n from "./i18n.config"
import { createVfm } from "vue-final-modal"
import "vue-final-modal/style.css"
import { createPinia } from "pinia"

const vfm = createVfm()
const pinia = createPinia()

createApp(App).use(router).use(i18n).use(vfm).use(pinia).mount("#app")
