import { translate } from "@/i18n";
import router from "@/router";
import { useAuthStore } from "@/store/auth";
import { alertController } from "@ionic/vue";

const confirmActiveSessionLogin = async (redirect?: boolean) => {
  const authStore = useAuthStore()
  const alert = await alertController
    .create({
      header: translate('Already active session'),
      message: translate(`A session for is already active for. Do you want to continue or login again?`, { partyName: authStore.current.partyName, oms: authStore.getOMS }),
      buttons: [{
        text: translate('Continue'),
        handler: () => {
          redirect
            ? window.location.href = `${authStore.getRedirectUrl}?oms=${authStore.oms}&token=${authStore.token.value}&expirationTime=${authStore.token.expiration}`
            : router.push('/')
        }
      }, {
        text: translate('Re-login'),
        handler: () => {
          const redirectUrl = authStore.getRedirectUrl
          authStore.logout()
          // re-set the redirectUrl if redirect flow was called
          // as it got cleared on logout
          if (redirect) authStore.setRedirectUrl(redirectUrl)
        }
      }]
    });
  return alert.present();
}

export {
  confirmActiveSessionLogin
}