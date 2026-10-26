/**
 * App actions mapped to the server permissions they require.
 *
 * Views, components and the app list should always refer to an action from this file instead of
 * hardcoding a server permission, so that a permission change is a one line change here.
 *
 * The value is the permission expression evaluated by `hasPermission` of the user store.
 * It supports the `OR` and `AND` operators, and an empty value means the action is allowed
 * for every logged in user.
 */
export default {
  APP_COMMERCE_VIEW: "COMMERCEUSER_VIEW",
  APP_ORDER_MANAGER_VIEW: "ORDERMGR_APP_VIEW",
  APP_BOPIS_VIEW: "BOPIS_APP_VIEW",
  APP_FULFILLMENT_VIEW: "FULFILLMENT_APP_VIEW",
  APP_LEGACY_FULFILLMENT_VIEW: "FULFILLMENT_LEGACY_APP_VIEW",
  APP_PREORDER_VIEW: "PREORDER_APP_VIEW",
  APP_ATP_VIEW: "ATP_APP_VIEW",
  APP_PRODUCTS_VIEW: "PRODUCTS_APP_VIEW",
  APP_ACCXUI_JOB_MANAGER_VIEW: "JOB_MANAGER_ACCXUI_APP_VIEW",
  APP_JOB_MANAGER_VIEW: "JOB_MANAGER_APP_VIEW",
  APP_RECEIVING_VIEW: "RECEIVING_APP_VIEW",
  APP_LEGACY_RECEIVING_VIEW: "RECEIVING_LEGACY_APP_VIEW",
  APP_INVENTORY_COUNT_VIEW: "INVCOUNT_APP_VIEW",
  APP_TRANSFERS_VIEW: "TRANSFERS_APP_VIEW",
  APP_IMPORT_VIEW: "IMPORT_APP_VIEW",
  APP_USERS_VIEW: "USERS_APP_VIEW",
  APP_FACILITIES_VIEW: "FACILITIES_APP_VIEW",
  APP_ORDER_ROUTING_VIEW: "ORDER_ROUTING_APP_VIEW",
  APP_COMPANY_VIEW: "COMPANY_APP_VIEW"
} as const satisfies Record<string, string>
