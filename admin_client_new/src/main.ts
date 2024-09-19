import { createApp } from "vue"
import i18n from "./i18n.config"
import "./style.css"
import App from "./App.vue"
import router from "./router"

createApp(App).use(router).use(i18n).mount("#app")
