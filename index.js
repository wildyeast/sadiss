import Vue from 'vue'
import App from './src/App.vue'
import('./pkg')
  .then(rustModule => {
    window.getOscillator = () => new rustModule.FmOsc()
  })
  .catch(console.error)

new Vue({
  render: h => h(App)
}).$mount('#app')
