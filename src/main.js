import { createApp } from 'vue'
import App from './App.vue'
import './index.css'
import VueEcho from 'vue-echo-laravel'
import Pusher from "pusher-js"

const app = createApp(App)

// app.use(VueEcho, {
//     broadcaster: 'pusher',
//     key: 'laravel_rdb',
//     cluster: 'mt1',
//     wsHost: window.location.hostname,
//     wsPort: 6001,
//     forceTLS: false,
//     disableStats: true
// })

app.mount('#app')

// import Echo from 'laravel-echo'
// import Pusher from 'pusher-js'
// window.Echo = new Echo({
    // broadcaster: 'pusher',
    // key: 'laravel_rdb',
    // cluster: 'mt1',
    // wsHost: window.location.hostname,
    // wsPort: 6001,
    // forceTLS: false,
    // disableStats: true
// });
