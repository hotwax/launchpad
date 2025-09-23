import { toastController } from '@ionic/vue';

interface App {
  handle: string,
  name: string,
  resource: string,
  type: string,
  appPermission?: string,
  appLegacyPermission?: string
}

const appInfo = [{
  handle: 'bopis',
  name: 'BOPIS',
  resource: require('../assets/images/BOPIS.svg'),
  type: 'Orders'
}, {
  handle: 'fulfillment',
  name: 'Fulfillment',
  resource: require('../assets/images/Fulfillment.svg'),
  type: 'Orders',
  appPermission: "APP_FULFILLMENT_VIEW",
  appLegacyPermission: "APP_LEGACY_FULFILLMENT_VIEW"
}, {
  handle: 'preorder',
  name: 'Pre-Orders',
  resource: require('../assets/images/PreOrder.svg'),
  type: 'Orders'
},  {
  handle: 'atp',
  name: 'Available to Promise',
  resource: require('../assets/images/Atp.svg'),
  type: 'Workflow'
}, {
  handle: 'job-manager',
  name: 'Job Manager',
  resource: require('../assets/images/Job.svg'),
  type: 'Workflow'
}, {
  handle: 'receiving',
  name: 'Receiving',
  resource: require('../assets/images/Receiving.svg'),
  type: 'Inventory'
}, {
  handle: 'inventorycount',
  name: 'Cycle Count',
  resource: require('../assets/images/CycleCount.svg'),
  type: 'Inventory'
}, {
  handle: 'transfers',
  name: 'Transfers',
  resource: require('../assets/images/Transfers.svg'),
  type: 'Inventory'
}, {
  handle: 'import',
  name: 'Import',
  resource: require('../assets/images/Import.svg'),
  type: 'Administration'
}, {
  handle: 'users',
  name: 'Users',
  resource: require('../assets/images/UserManagement.svg'),
  type: 'Administration'
}, {
  handle: 'facilities',
  name: 'Facilities',
  resource: require('../assets/images/Facilities.svg'),
  type: 'Administration'
}, {
  handle: 'order-routing',
  name: 'Order Routing',
  resource: require('../assets/images/OrderRouting.svg'),
  type: 'Workflow'
}, {
  handle: 'company',
  name: 'Company',
  resource: require('../assets/images/Company.svg'),
  type: 'Administration'
}] as App[]

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

const isOmsWithMaarg = (handle: string, environment = "") => {
  const appHandle = environment ? handle + environment : handle
  const appsWithMarg = JSON.parse(process.env.VUE_APP_OMS_WITH_MAARG ? process.env.VUE_APP_OMS_WITH_MAARG : [])
  return appsWithMarg.some((appName: string) => appHandle.includes(appName))
}

export { App, appInfo, isMaargLogin, isOmsWithMaarg, showToast }