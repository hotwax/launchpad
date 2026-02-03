import { toastController } from '@ionic/vue';

import bopisIcon from '../assets/images/BOPIS.svg'

import fulfillmentIcon from '../assets/images/Fulfillment.svg'
import preorderIcon from '../assets/images/PreOrder.svg'
import atpIcon from '../assets/images/Atp.svg'
import jobIcon from '../assets/images/Job.svg'
import receivingIcon from '../assets/images/Receiving.svg'
import cycyleCountIcon from '../assets/images/CycleCount.svg'
import transfersIcon from '../assets/images/Transfers.svg'
import importIcon from '../assets/images/Import.svg'
import usersIcon from '../assets/images/UserManagement.svg'
import facilitiesIcon from '../assets/images/Facilities.svg'
import orderRoutingIcon from '../assets/images/OrderRouting.svg'
import companyIcon from '../assets/images/Company.svg'


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
  resource: bopisIcon,
  type: 'Orders'
}, {
  handle: 'fulfillment',
  name: 'Fulfillment',
  resource: fulfillmentIcon,
  type: 'Orders',
  appPermission: "APP_FULFILLMENT_VIEW",
  appLegacyPermission: "APP_LEGACY_FULFILLMENT_VIEW"
}, {
  handle: 'preorder',
  name: 'Pre-Orders',
  resource: preorderIcon,
  type: 'Orders'
},  {
  handle: 'atp',
  name: 'Available to Promise',
  resource: atpIcon,
  type: 'Workflow'
}, {
  handle: 'job-manager',
  name: 'Job Manager',
  resource: jobIcon,
  type: 'Workflow'
}, {
  handle: 'receiving',
  name: 'Receiving',
  resource: receivingIcon,
  type: 'Inventory'
}, {
  handle: 'inventorycount',
  name: 'Cycle Count',
  resource: cycyleCountIcon,
  type: 'Inventory'
}, {
  handle: 'transfers',
  name: 'Transfers',
  resource: transfersIcon,
  type: 'Inventory'
}, {
  handle: 'import',
  name: 'Import',
  resource: importIcon,
  type: 'Administration'
}, {
  handle: 'users',
  name: 'Users',
  resource: usersIcon,
  type: 'Administration'
}, {
  handle: 'facilities',
  name: 'Facilities',
  resource: facilitiesIcon,
  type: 'Administration'
}, {
  handle: 'order-routing',
  name: 'Order Routing',
  resource: orderRoutingIcon,
  type: 'Workflow'
}, {
  handle: 'company',
  name: 'Company',
  resource: companyIcon,
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

export type { App }
export { appInfo, showToast }
