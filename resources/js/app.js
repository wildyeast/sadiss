require('./bootstrap');

import { createApp, h } from 'vue';
import { createInertiaApp } from '@inertiajs/inertia-vue3';
import { InertiaProgress } from '@inertiajs/progress';
import Oruga from '@oruga-ui/oruga-next'
import { bulmaConfig } from '@oruga-ui/theme-bulma'
import '@oruga-ui/theme-bulma/dist/bulma.css'

const appName = window.document.getElementsByTagName('title')[0]?.innerText || 'Laravel';

const customBulmaConfig  =  {
  ...bulmaConfig,
  iconPack: 'material-icons',
  customIconPacks: {
    'material-icons': {
      iconPrefix: 'mi-',
    },
  },
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => require(`./Pages/${name}.vue`),
    setup({ el, app, props, plugin }) {
        const App = createApp({ render: () => h(app, props) })
          .use(plugin)
          .use(Oruga, customBulmaConfig)
          .mixin({ methods: { route } })
        App.mount(el)
        return App
    },
});

InertiaProgress.init({ color: '#4B5563' });
