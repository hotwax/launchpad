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
  appPermission: "ORDERMGR_APP_VIEW",
}, {
  handle: "bopis",
  name: "BOPIS",
  resource: bopisIcon,
  type: "Orders",
  appPermission: "BOPIS_APP_VIEW",
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
  appPermission: "PREORDER_APP_VIEW",
}, {
  handle: "atp",
  name: "Available to Promise",
  resource: productsIcon,
  type: "Workflow",
  appPermission: "ATP_APP_VIEW",
}, {
  handle: "products",
  name: "Products",
  resource: productsIcon,
  type: "Workflow",
  appPermission: "PRODUCTS_APP_VIEW",
}, {
  handle: "job-manager",
  name: "Job Manager",
  resource: jobIcon,
  type: "Workflow",
  appPermission: "JOB_MANAGER_ACCXUI_APP_VIEW",
  appLegacyPermission: "JOB_MANAGER_APP_VIEW"
}, {
  handle: "receiving",
  name: "Receiving",
  resource: receivingIcon,
  type: "Inventory",
  appPermission: "RECEIVING_APP_VIEW",
  appLegacyPermission: "RECEIVING_LEGACY_APP_VIEW"
}, {
  handle: "inventorycount",
  name: "Cycle Count",
  resource: cycyleCountIcon,
  type: "Inventory",
  appPermission: "INVCOUNT_APP_VIEW",
}, {
  handle: "transfers",
  name: "Transfers",
  resource: transfersIcon,
  type: "Inventory",
  appPermission: "TRANSFERS_APP_VIEW",
}, {
  handle: "import",
  name: "Import",
  resource: importIcon,
  type: "Administration",
  appPermission: "IMPORT_APP_VIEW",
}, {
  handle: "users",
  name: "Users",
  resource: usersIcon,
  type: "Administration",
  appPermission: "USERS_APP_VIEW",
}, {
  handle: "facilities",
  name: "Facilities",
  resource: facilitiesIcon,
  type: "Administration",
  appPermission: "FACILITIES_APP_VIEW",
}, {
  handle: "order-routing",
  name: "Order Routing",
  resource: orderRoutingIcon,
  type: "Workflow",
  appPermission: "ORDER_ROUTING_APP_VIEW",
}, {
  handle: "company",
  name: "Company",
  resource: companyIcon,
  type: "Administration",
  appPermission: "COMPANY_APP_VIEW",
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

// The OMS as the user entered it is what the apps receive, as main sent it: a name stays a name and a full
// URL gets the /api/ it is missing. The apps save it in the oms cookie Launchpad compares with its own
const getOmsLinkParam = (oms: string) => {
  return oms.startsWith("http") && !oms.includes("/api") ? `${oms}/api/` : oms
}

// Local testing only: VITE_APP_URLS maps an app's host handle (e.g. "fulfillment-legacy") to the URL it is served
// on locally, so links to the apps and redirectUrls from them map between that and https://<handle>.hotwax.io.
// Unset, every URL is left as it is
const localAppUrls = JSON.parse(import.meta.env.VITE_APP_URLS || "{}") as Record<string, string>

const toLocalAppUrl = (url: string) => {
  const match = url.match(/^https:\/\/([^/.]+)\.hotwax\.io(.*)$/)
  return match && localAppUrls[match[1]] ? localAppUrls[match[1]] + match[2] : url
}

const toHotwaxAppUrl = (url: string) => {
  const handle = Object.keys(localAppUrls).find((key) => url.startsWith(localAppUrls[key]))
  return handle ? `https://${handle}.hotwax.io${url.slice(localAppUrls[handle].length)}` : url
}

// The same OMS can be written as "https://oms.example.com" or with the API path an app added
// ("https://oms.example.com/api/"), so OMS values are compared without that path, trailing slashes or case
const normalizeOms = (oms: string) => {
  return (oms || "").trim().toLowerCase().replace(/\/(api|rest\/s1)\/?$/, "").replace(/\/+$/, "")
}

const isOmsWithMaarg = (handle: string, environment = "") => {
  const appHandle = environment ? handle + environment : handle
  const appsWithMarg = JSON.parse(import.meta.env.VITE_OMS_WITH_MAARG ? import.meta.env.VITE_OMS_WITH_MAARG : [])

  return appsWithMarg.some((appName: string) => appHandle.includes(appName))
}

export type { App }
export { appInfo, getOmsLinkParam, isMaargLogin, isOmsWithMaarg, normalizeOms, showToast, toHotwaxAppUrl, toLocalAppUrl }
