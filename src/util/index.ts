import { toastController } from '@ionic/vue';

const showToast = async (message: string) => {
  const toast = await toastController
    .create({
      message,
      duration: 3000,
      position: 'bottom',
    })
  return toast.present();
}

const isMaargLogin = (handle: string, environment = "") => {
  const appHandle = environment ? handle + environment : handle
  const maargLoginApps = JSON.parse(process.env.VUE_APP_MAARG_LOGIN ? process.env.VUE_APP_MAARG_LOGIN : [])
  return maargLoginApps.some((appName: string) => appHandle.includes(appName))
}

export { isMaargLogin, showToast }