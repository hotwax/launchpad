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

const isMaargLogin = (handle: string) => {
  const maargLoginApps = JSON.parse(process.env.VUE_APP_MAARG_LOGIN ? process.env.VUE_APP_MAARG_LOGIN : [])
  return maargLoginApps.some((appName: string) => handle.includes(appName))
}

const isMaargLoginRequired = (handle: string) => {
  const maargOmsRequiredApps = JSON.parse(process.env.VUE_APP_MAARG_LOGIN_REQUIRED ? process.env.VUE_APP_MAARG_LOGIN_REQUIRED : [])
  return maargOmsRequiredApps.some((appName: string) => handle.includes(appName))
}

export { isMaargLogin, isMaargLoginRequired, showToast }