import { createApp } from 'vue'
import { IonicVue } from '@ionic/vue';
//import { createPinia } from 'pinia'
//import i18n from './i18n'
//import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

import App from './App.vue'
import router from './router'

import permissionPlugin, { Actions, hasPermission } from '@/authorization';
import permissionRules from '@/authorization/Rules';
import permissionActions from '@/authorization/Actions';

import { createDxpI18n, createDxpPinia } from '@common'
import localeMessages from '@/locales'

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

navigator.serviceWorker.register("no-op-service-worker.js")

// Initialize i18n with app’s locales
const i18n = createDxpI18n(localeMessages)
const pinia = createDxpPinia()

const app = createApp(App)
  .use(IonicVue, {
    mode: 'md',
    innerHTMLTemplatesEnabled: true
  })
  .use(router)
  .use(permissionPlugin, {
    rules: permissionRules,
    actions: permissionActions,
    Actions,
    hasPermission
  })
  .use(i18n);

//const pinia = createPinia();
//pinia.use(piniaPluginPersistedstate)

app.use(pinia)


router.isReady().then(() => {
  app.mount('#app');
});
