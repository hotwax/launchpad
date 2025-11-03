import { createI18n, LocaleMessages, VueMessageType } from 'vue-i18n'

/**
 * Load locale messages
 * 
 * The loaded `JSON` locale messages is pre-compiled by `@intlify/vue-i18n-loader`, which is integrated into `vue-cli-plugin-i18n`.
 * See: https://github.com/intlify/vue-i18n-loader#rocket-i18n-resource-pre-compilation
 */
const locales = import.meta.glob('./locales/*.json', { eager: true });

function loadLocaleMessages() {
  const messages: Record<string, any> = {};
  for (const path in locales) {
    const matched = path.match(/([A-Za-z0-9-_]+)\./i);
    if (matched && matched[1]) {
      messages[matched[1]] = (locales[path] as any).default || locales[path];
    }
  }
  return messages;
}


const i18n = createI18n({
  locale: import.meta.env.VITE_VUE_APP_I18N_LOCALE || 'en',
  fallbackLocale: import.meta.env.VITE_VUE_APP_I18N_FALLBACK_LOCALE || 'en',
  numberFormats: JSON.parse(import.meta.env.VITE_VUE_APP_CURRENCY_FORMATS),
  messages: loadLocaleMessages()
})

// TODO Check if this is needed in updated versions
// Currently this method is added to be used in ts files
/*const translate = (key: string, named?: Record<string, unknown>) => {
  if (!key) {
    return '';
  }
  //return named ? i18n.global.t(key, named) : i18n.global.t(key);
  return named
  ? (i18n.global.t as any)(key, named)
  : (i18n.global.t as any)(key);
};*/


function translate(key: string, named?: Record<string, string>) {
  const i18nAny = i18n as any;
  return named ? i18nAny.global.t(key, named) : i18nAny.global.t(key);
}


export { i18n as default, translate }