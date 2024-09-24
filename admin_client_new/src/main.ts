import { createApp } from "vue"
import "./style.css"
import App from "./App.vue"
import router from "./router"
import i18n from "./i18n.config"
import { createVfm } from "vue-final-modal"
import "vue-final-modal/style.css"

const vfm = createVfm()

createApp(App).use(router).use(i18n).use(vfm).mount("#app")
