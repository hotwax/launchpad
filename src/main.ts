import { createApp } from 'vue'
import { IonicVue } from '@ionic/vue';
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router'

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/* Theme variables */
import './theme/variables.css';
import '@hotwax/apps-theme';
import { dxpComponents } from '@hotwax/dxp-components';
import localeMessages from './locales';


const app = createApp(App)
  .use(IonicVue, {
    mode: 'md',
    innerHTMLTemplatesEnabled: true
  })
  .use(router)
  .use(dxpComponents, {
    localeMessages
  })

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate)

app.use(pinia)


router.isReady().then(() => {
  app.mount('#app');
});
