require('./bootstrap');

import { createApp, h } from 'vue';
import { createInertiaApp } from '@inertiajs/inertia-vue3';
import { InertiaProgress } from '@inertiajs/progress';
import Oruga from '@oruga-ui/oruga-next'

const appName = window.document.getElementsByTagName('title')[0]?.innerText || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => require(`./Pages/${name}.vue`),
    setup({ el, app, props, plugin }) {
        const App = createApp({ render: () => h(app, props) })
          .use(plugin)
          .use(Oruga)
          .mixin({ methods: { route } })
        App.mount(el)
        return App
    },
});

InertiaProgress.init({ color: '#4B5563' });
