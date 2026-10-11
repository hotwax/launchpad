import { toastController } from "@ionic/vue";

import bopisIcon from "../assets/images/BOPIS.svg"
import companyIcon from "../assets/images/Company.svg"
import cycyleCountIcon from "../assets/images/CycleCount.svg"
import facilitiesIcon from "../assets/images/Facilities.svg"
import fulfillmentIcon from "../assets/images/Fulfillment.svg"
import importIcon from "../assets/images/Import.svg"
import jobIcon from "../assets/images/JobManager.svg"
import orderManagerIcon from "../assets/images/OrderManager.svg"
import orderRoutingIcon from "../assets/images/OrderRouting.svg"
import preorderIcon from "../assets/images/PreOrder.svg"
import productsIcon from "../assets/images/Products.svg"
import receivingIcon from "../assets/images/Receiving.svg"
import transfersIcon from "../assets/images/Transfers.svg"
import usersIcon from "../assets/images/UserManagement.svg"

interface App {
  handle: string,
  name: string,
  resource: string,
  type: string,
  appPermission?: string,
  appLegacyPermission?: string
}

const appInfo = [{
  handle: "order-manager",
  name: "Order Manager",
  resource: orderManagerIcon,
  type: "Orders",
  appPermission: "APP_ORDER_MANAGER_VIEW",
}, {
  handle: "bopis",
  name: "BOPIS",
  resource: bopisIcon,
  type: "Orders",
  appPermission: "APP_BOPIS_VIEW",
}, {
  handle: "fulfillment",
  name: "Fulfillment",
  resource: fulfillmentIcon,
  type: "Orders",
  appPermission: "FULFILLMENT_APP_VIEW",
  appLegacyPermission: "FULFILLMENT_LEGACY_APP_VIEW"
}, {
  handle: "preorder",
  name: "Pre-Orders",
  resource: preorderIcon,
  type: "Orders",
  appPermission: "APP_PREORDER_VIEW",
}, {
  handle: "atp",
  name: "Available to Promise",
  resource: productsIcon,
  type: "Workflow",
  appPermission: "APP_ATP_VIEW",
}, {
  handle: "products",
  name: "Products",
  resource: productsIcon,
  type: "Workflow",
  appPermission: "APP_PRODUCTS_VIEW",
}, {
  handle: "job-manager",
  name: "Job Manager",
  resource: jobIcon,
  type: "Workflow",
  appPermission: "APP_ACCXUI_JOB_MANAGER_VIEW",
  appLegacyPermission: "APP_JOB_MANAGER_VIEW"
}, {
  handle: "receiving",
  name: "Receiving",
  resource: receivingIcon,
  type: "Inventory",
  appPermission: "APP_RECEIVING_VIEW",
  appLegacyPermission: "APP_LEGACY_RECEIVING_VIEW"
}, {
  handle: "inventorycount",
  name: "Cycle Count",
  resource: cycyleCountIcon,
  type: "Inventory",
  appPermission: "APP_INVENTORY_COUNT_VIEW",
}, {
  handle: "transfers",
  name: "Transfers",
  resource: transfersIcon,
  type: "Inventory",
  appPermission: "APP_TRANSFERS_VIEW",
}, {
  handle: "import",
  name: "Import",
  resource: importIcon,
  type: "Administration",
  appPermission: "APP_IMPORT_VIEW",
}, {
  handle: "users",
  name: "Users",
  resource: usersIcon,
  type: "Administration",
  appPermission: "APP_USERS_VIEW",
}, {
  handle: "facilities",
  name: "Facilities",
  resource: facilitiesIcon,
  type: "Administration",
  appPermission: "APP_FACILITIES_VIEW",
}, {
  handle: "order-routing",
  name: "Order Routing",
  resource: orderRoutingIcon,
  type: "Workflow",
  appPermission: "APP_ORDER_ROUTING_VIEW",
}, {
  handle: "company",
  name: "Company",
  resource: companyIcon,
  type: "Administration",
  appPermission: "APP_COMPANY_VIEW",
}] as App[]

const showToast = async (message: string) => {
  const toast = await toastController
    .create({
      message,
      duration: 3000,
      position: "bottom",
    })

  return toast.present();
}

const isMaargLogin = (handle: string, environment = "") => {
  const appHandle = environment ? handle + environment : handle
  const maargLoginApps = JSON.parse(import.meta.env.VITE_MAARG_LOGIN ? import.meta.env.VITE_MAARG_LOGIN : [])

  return maargLoginApps.some((appName: string) => appHandle.includes(appName))
}

const isOmsWithMaarg = (handle: string, environment = "") => {
  const appHandle = environment ? handle + environment : handle
  const appsWithMarg = JSON.parse(import.meta.env.VITE_OMS_WITH_MAARG ? import.meta.env.VITE_OMS_WITH_MAARG : [])

  return appsWithMarg.some((appName: string) => appHandle.includes(appName))
}

export type { App }
export { appInfo, isMaargLogin, isOmsWithMaarg, showToast }
