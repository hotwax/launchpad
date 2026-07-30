import { useAuthStore } from '@/store/auth';
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
  type: 'Orders',
  appPermission: "APP_BOPIS_VIEW",
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
  type: 'Orders',
  appPermission: "APP_PREORDER_VIEW",
}, {
  handle: 'atp',
  name: 'Available to Promise',
  resource: require('../assets/images/Products.svg'),
  type: 'Workflow',
  appPermission: "APP_ATP_VIEW",
}, {
  handle: "products",
  name: "Products",
  resource: require('../assets/images/Products.svg'),
  type: "Workflow",
  appPermission: "APP_PRODUCTS_VIEW",
}, {
  handle: "order-manager",
  name: "Order Manager",
  resource: require('../assets/images/OrderManager.svg'),
  type: "Workflow",
  appPermission: "APP_ORDER_MANAGER_VIEW",
}, {
  handle: 'job-manager',
  name: 'Job Manager',
  resource: require('../assets/images/JobManager.svg'),
  type: 'Workflow',
  appPermission: "APP_ACCXUI_JOB_MANAGER_VIEW",
  appLegacyPermission: "APP_JOB_MANAGER_VIEW"
}, {
  handle: 'receiving',
  name: 'Receiving',
  resource: require('../assets/images/Receiving.svg'),
  type: 'Inventory',
  appPermission: "APP_RECEIVING_VIEW",
}, {
  handle: 'inventorycount',
  name: 'Cycle Count',
  resource: require('../assets/images/CycleCount.svg'),
  type: 'Inventory',
  appPermission: "APP_INVENTORY_COUNT_VIEW",
}, {
  handle: 'transfers',
  name: 'Transfers',
  resource: require('../assets/images/Transfers.svg'),
  type: 'Inventory',
  appPermission: "APP_TRANSFERS_VIEW",
}, {
  handle: 'import',
  name: 'Import',
  resource: require('../assets/images/Import.svg'),
  type: 'Administration',
  appPermission: "APP_IMPORT_VIEW",
}, {
  handle: 'users',
  name: 'Users',
  resource: require('../assets/images/UserManagement.svg'),
  type: 'Administration',
  appPermission: "APP_USERS_VIEW",
}, {
  handle: 'facilities',
  name: 'Facilities',
  resource: require('../assets/images/Facilities.svg'),
  type: 'Administration',
  appPermission: "APP_FACILITIES_VIEW",
}, {
  handle: 'order-routing',
  name: 'Order Routing',
  resource: require('../assets/images/OrderRouting.svg'),
  type: 'Workflow',
  appPermission: "APP_ORDER_ROUTING_VIEW",
}, {
  handle: 'company',
  name: 'Company',
  resource: require('../assets/images/Company.svg'),
  type: 'Administration',
  appPermission: "APP_COMPANY_VIEW",
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
