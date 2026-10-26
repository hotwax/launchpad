<template>
  <ion-page>
    <ion-content>
      <div v-if="!isInitializing && !isConfirmingForActiveSession" class="flex">
        <form class="login-container" @keyup.enter="handleSubmit()" @submit.prevent data-testid="login-form">
          <Logo />
          <section v-if="showOmsInput">
            <ion-item lines="full">
              <ion-input id="instanceUrl" v-model="instanceUrl" :label="translate('OMS')" label-placement="fixed" name="instanceUrl" type="text" required data-testid="oms-input" />
            </ion-item>

            <div class="ion-padding">
              <!-- @keyup.enter.stop to stop the form from submitting on enter press as keyup.enter is already bound
              through the form above, causing both the form and the button to submit. -->
              <ion-button color="primary" expand="block" @click.prevent="isCheckingOms ? '' : setOms()" @keyup.enter.stop data-testid="next-button">
                {{ translate("Next") }}
                <ion-spinner v-if="isCheckingOms" slot="end" name="crescent" />
                <ion-icon v-else slot="end" :icon="arrowForwardOutline" />
              </ion-button>
            </div>

            <ion-list v-if="isDevServer && (isDiscoveringLocalApiServers || devServers.length)">
              <ion-list-header>
                <ion-label>{{ translate("Dev servers") }}</ion-label>
                <ion-spinner v-if="isDiscoveringLocalApiServers" name="crescent" />
              </ion-list-header>
              <ion-item v-for="server in devServers" :key="server.oms" button :disabled="isCheckingOms" @click="selectDevServer(server)">
                <ion-label>
                  {{ server.label }}
                  <p>{{ server.oms }}</p>
                </ion-label>
                <ion-badge v-if="server.hasAutoLogin" color="primary" slot="end">
                  {{ translate("Auto login") }}
                </ion-badge>
                <ion-note v-else-if="server.signal" slot="end">
                  {{ server.signal === "loginOptions" ? translate("Ready") : translate("Detected") }}
                </ion-note>
              </ion-item>
            </ion-list>
          </section>

          <section v-else>
            <div class="ion-text-center ion-margin-bottom">
              <ion-chip :outline="true" @click="toggleOmsInput()" data-testid="oms-chip">
                {{ cookieHelper().get("oms") }}
              </ion-chip>
            </div>

            <ion-item lines="full">
              <ion-input id="username" v-model="username" :label="translate('Username')" label-placement="fixed" name="username" type="text" required data-testid="username-input" />
            </ion-item>
            <ion-item lines="none">
              <ion-input id="password" v-model="password" :label="translate('Password')" label-placement="fixed" name="password" type="password" required data-testid="password-input" />
            </ion-item>

            <div class="ion-padding">
              <ion-button color="primary" expand="block" @click="isLoggingIn ? '' : login()" data-testid="login-button">
                {{ translate("Login") }}
                <ion-spinner v-if="isLoggingIn" slot="end" name="crescent" />
                <ion-icon v-else slot="end" :icon="arrowForwardOutline" />
              </ion-button>
            </div>

            <ion-list v-if="canDevAutoLoginForCurrentOms">
              <ion-item button :disabled="isLoggingIn" @click="attemptDevAutoLogin()" data-testid="dev-login-item">
                <ion-label>
                  {{ devUsername }}
                  <p>{{ translate("Configured dev user") }}</p>
                </ion-label>
                <ion-badge color="primary" slot="end">
                  {{ translate("Auto login") }}
                </ion-badge>
              </ion-item>
            </ion-list>

            <div v-if="isDevServer && !canDevAutoLoginForCurrentOms" class="ion-text-center ion-padding-bottom">
              <ion-note>
                <a href="https://github.com/hotwax/accxui/blob/main/docs/DEV_AUTO_LOGIN.md" target="_blank" rel="noopener noreferrer">
                  {{ translate("How to configure auto login") }}
                </a>
              </ion-note>
            </div>
          </section>
        </form>
      </div>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end" @click="router.push('/')">
        <ion-fab-button color="medium" data-testid="home-button">
          <ion-icon :icon="gridOutline" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>


<script setup lang="ts">
import { commonUtil, cookieHelper, logger, translate } from "@common";
import {
  IonBadge,
  IonButton,
  IonChip,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonSpinner,
  loadingController,
  onIonViewDidEnter,
  onIonViewWillEnter
} from "@ionic/vue"
import { arrowForwardOutline, gridOutline } from "ionicons/icons"
import { computed, ref } from "vue";
import { discoverLocalApiServers, type LocalApiServer, type LocalApiServerSignal } from "@common/core/localApiServerDiscovery"
import Logo from "@/components/Logo.vue"
import { useAuth } from "@/composables/auth"
import { useUserStore } from "@/store/user"
import { appInfo, getOmsLinkParam, isMaargLogin, isOmsWithMaarg, showToast, toHotwaxAppUrl, toLocalAppUrl } from "@/util"
import router from "../router"

const userStore = useUserStore();
const { clearAuth, fetchLoginOptions, isAuthenticated, logout, loginOption, updateOMS } = useAuth();

const hasPermission = (permissionId: string) => userStore.hasPermission(permissionId)

const username = ref("")
const password = ref("")
const instanceUrl = ref("")
const showOmsInput = ref(false)
const isInitializing = ref(true)
const isConfirmingForActiveSession = ref(false)
const loader = ref(null) as any
const isCheckingOms = ref(false)
const isLoggingIn = ref(false)

const alias = import.meta.env.VITE_ALIAS ? JSON.parse(import.meta.env.VITE_ALIAS) : {}
const defaultAlias = import.meta.env.VITE_DEFAULT_ALIAS

// Dev-only sign in with the shared root credentials, as the framework Login offers (docs/DEV_AUTO_LOGIN.md).
// commonEnvPlugin brings the root VITE_* values in only while vite serves the app.
const isDevServer = import.meta.env.DEV && typeof window !== "undefined"
const devUsername = import.meta.env.VITE_DEV_USERNAME || import.meta.env.VITE_USERNAME || ""
const devPassword = import.meta.env.VITE_DEV_PASSWORD || import.meta.env.VITE_PASSWORD || ""
const canDevAutoLogin = Boolean(isDevServer && devUsername && devPassword)

const isDiscoveringLocalApiServers = ref(false)
const localApiServers = ref<LocalApiServer[]>([])
let hasDiscoveredLocalApiServers = false

interface DevServer {
  label: string,
  oms: string,
  hasAutoLogin: boolean,
  signal?: LocalApiServerSignal
}

const normalizeOmsUrl = (url: string) => url.trim().toLowerCase().replace(/\/+$/, "")
const resolveAlias = (oms: string) => alias[oms.trim().toLowerCase()] || oms

// The dev credentials only go to the default server, an aliased server or a local one, never to an OMS typed in
const isDevLoginOms = (oms: string) => {
  if(!oms) return false
  const resolvedOms = normalizeOmsUrl(resolveAlias(oms))
  const devOms = [defaultAlias, ...Object.values(alias)].filter(Boolean).map((url: any) => normalizeOmsUrl(resolveAlias(String(url))))

  return devOms.includes(resolvedOms) || resolvedOms.includes("localhost") || resolvedOms.includes("127.0.0.1")
}

// userStore.oms, not the cookie: cookies are not reactive
const canDevAutoLoginForCurrentOms = computed(() => canDevAutoLogin && isDevLoginOms(userStore.oms || cookieHelper().get("oms") || ""))

const devServers = computed<DevServer[]>(() => {
  const servers: DevServer[] = []
  const seenOms = new Set<string>()
  const addServer = (server: DevServer) => {
    const normalizedOms = normalizeOmsUrl(server.oms)
    const existing = servers.find((devServer) => normalizeOmsUrl(devServer.oms) === normalizedOms)
    if(existing) {
      existing.signal = server.signal
    } else if(!seenOms.has(normalizedOms)) {
      servers.push(server)
      seenOms.add(normalizedOms)
    }
  }

  if(defaultAlias) {
    const oms = resolveAlias(defaultAlias)
    addServer({ label: Object.keys(alias).find((key) => normalizeOmsUrl(alias[key]) === normalizeOmsUrl(oms)) || defaultAlias, oms, hasAutoLogin: canDevAutoLogin })
  }
  Object.entries(alias).forEach(([label, oms]) => addServer({ label, oms: String(oms), hasAutoLogin: canDevAutoLogin }))
  localApiServers.value.forEach((server) => addServer({ label: server.label, oms: server.oms, hasAutoLogin: canDevAutoLogin, signal: server.signal }))

  return servers
})

async function discoverLocalApiServerOptions() {
  if(!isDevServer || hasDiscoveredLocalApiServers) return

  hasDiscoveredLocalApiServers = true
  isDiscoveringLocalApiServers.value = true
  try {
    localApiServers.value = await discoverLocalApiServers()
  } catch (error) {
    logger.error("User [Context: launchpad] - Failed to discover local API servers", error)
  }
  isDiscoveringLocalApiServers.value = false
}

async function attemptDevAutoLogin() {
  if(!canDevAutoLogin || isLoggingIn.value) return

  username.value = devUsername
  password.value = devPassword
  await login()
}

async function selectDevServer(server: DevServer) {
  if(isCheckingOms.value) return

  instanceUrl.value = server.oms
  await setOms()
  // setOms moves to the credentials step only for a reachable BASIC OMS (SSO redirects away)
  if(showOmsInput.value || !server.hasAutoLogin) return

  // Sign in from the OMS step behind the loader instead of flashing the credentials form;
  // show that form only when the dev sign in fails
  showOmsInput.value = true
  await presentLoader("Logging in...")
  await attemptDevAutoLogin()
  dismissLoader()
  if(!isAuthenticated.value) {
    showOmsInput.value = false
  }
}

// Keep the form hidden until initialise decides which step to show
onIonViewWillEnter(() => {
  isInitializing.value = true
})

// After the enter transition: a redirect fired while the page is still animating in changes the URL
// but leaves this view on screen
onIonViewDidEnter(() => {
  initialise()
})

async function initialise() {
  // Read on every visit: Ionic keeps this page alive, so a value taken at setup would keep the first visit's query
  const route = router.currentRoute.value
  // An app served locally (VITE_APP_URLS) is handled under its hotwax.io host, which the app checks below read
  const redirectUrl = route.query?.redirectUrl ? toHotwaxAppUrl(route.query.redirectUrl as string) : ""
  isInitializing.value = true
  await presentLoader("Processing")

  // Run the basic login flow when oms and token both are found in query
  if(route.query?.oms && route.query?.token) {
    // Need to consider the info received in query as valid and thus need to clear the auth state
    clearAuth()
    const { oms } = route.query as any
    updateOMS(oms)
    userStore.oms = oms
    await fetchLoginOptions()
    await login(route.query)
    dismissLoader();

    return;
  } else if(route.query?.token) {
    // SAML login handling as only token will be returned in the query when login through SAML
    await login(route.query)
    dismissLoader();
    // A failed SSO return goes to Home as on main, instead of leaving the form hidden
    if(!isAuthenticated.value) {
      isInitializing.value = false
      router.replace("/")
    }

    return
  }

  // The below if condition becomes invalid once all the apps will be migrated to accxui pattern
  // as in the accxui pattern, app will in no case redirect to launchpad once logged out.
  //
  // logout from Launchpad if logged out from the app
  if(route.query?.isLoggedOut === "true") {
    // We will already mark the user as unuauthorised when log-out from the app
    // For the case of apps using maarg login, we will call the logout api from launchpad

    // TODO: the above comment becomes invalid after calling the logout always from the launchpad
    // With this change app will never call the logout api and launchpad is responsible for calling the logout api
    await logout(isMaargLogin(redirectUrl) ? {} : { isUserUnauthorised: true })
  }

  // fetch login options only if OMS is there as API calls require OMS
  if(cookieHelper().get("oms")) {
    await fetchLoginOptions()
  }

  // show OMS input if SAML if configured or query or state does not have OMS
  if(loginOption.value.loginAuthType !== "BASIC" || route.query?.oms || !cookieHelper().get("oms")) {
    showOmsInput.value = true
  }

  // Update OMS input if found in query
  if(route.query?.oms) {
    instanceUrl.value = route.query.oms as string
  }

  // setting redirectUrl in the state; a visit without one clears what an earlier visit left, as main did by
  // sending /login to Home, so a later login does not send the user on to that app again.
  // The SSO return (token only) keeps it, it handed off above before reaching here
  userStore.setRedirectUrl(redirectUrl)

  // if a session is already active, login directly in the app
  if(isAuthenticated.value) {
    if(userStore.getRedirectUrl) {
      await userStore.fetchPermissions();
      generateRedirectionLink();
    } else {
      router.push("/")
    }
    dismissLoader();
    isInitializing.value = false

    return
  }

  // A session in the cookies the store does not know (cookies on a host are shared with the other apps, and the
  // store may have been reset): log in with its token, which also takes its OMS
  if(cookieHelper().get("oms") && cookieHelper().get("token") && cookieHelper().get("userId") && cookieHelper().get("expirationTime")) {
    await login({ token: cookieHelper().get("token"), expirationTime: cookieHelper().get("expirationTime") })
    dismissLoader();
    isInitializing.value = false

    return
  }

  instanceUrl.value = commonUtil.getOMSInstanceName();
  if(instanceUrl.value) {
    // If the current URL is available in alias show it for consistency
    const currentInstanceUrlAlias = Object.keys(alias).find((key) => alias[key] === commonUtil.getOMSInstanceName());
    if(currentInstanceUrlAlias) {
      instanceUrl.value = currentInstanceUrlAlias
    }
  }
  // If there is no current preference set the default one
  if(!instanceUrl.value && defaultAlias) {
    instanceUrl.value = defaultAlias
  }

  if(showOmsInput.value) {
    discoverLocalApiServerOptions()

    // With dev credentials and a single dev server, go straight to the credentials step and its one-click dev user
    const isBasicLoginOption = !Object.keys(loginOption.value).length || loginOption.value.loginAuthType === "BASIC"
    if(canDevAutoLogin && !isAuthenticated.value && !route.query?.oms && instanceUrl.value && isBasicLoginOption && Object.keys(alias).length <= 1) {
      await setOms()
    }
  }

  dismissLoader();
  isInitializing.value = false
}

async function presentLoader(message: string) {
  if(!loader.value) {
    loader.value = await loadingController
      .create({
        message: translate(message),
        translucent: true,
        backdropDismiss: false
      });
  }
  loader.value.present();
}

function dismissLoader() {
  if(loader.value) {
    loader.value.dismiss();
    loader.value = null as any;
  }
}

function toggleOmsInput() {
  showOmsInput.value = !showOmsInput.value
  // clearing username and password if moved to OMS input
  if(showOmsInput.value) {
    username.value = ""
    password.value = ""
    discoverLocalApiServerOptions()
  }
}

// on pressing Enter after inputting OMS, the form is submitted through the login method
// handleSubmit will handle the flow based on the input values for OMS, username and password
function handleSubmit() {
  if(instanceUrl.value.trim() && showOmsInput.value && (!username.value && !password.value)) {
    setOms()
  } else if(instanceUrl.value) {
    login()
  }
}

async function setOms() {
  if(!instanceUrl.value) {
    showToast(translate("Please fill in the OMS"));

    return
  }

  const instanceURL = instanceUrl.value.trim().toLowerCase();
  // An instance name or URL never contains whitespace, so reject it before it reaches a cookie
  if(/\s/.test(instanceURL)) {
    showToast(translate("Enter a valid OMS name or URL."));

    return
  }

  isCheckingOms.value = true

  updateOMS(alias[instanceURL] ? alias[instanceURL] : instanceURL)
  userStore.oms = alias[instanceURL] ? alias[instanceURL] : instanceURL

  // run SAML login flow if login options are configured for the OMS
  if(!(await fetchLoginOptions())) {
    // Stay on the OMS step: neither OFBiz nor Moqui answered, so there is nothing to sign in to
    showToast(translate("Unable to reach the OMS. Check the OMS name and try again."))
    isCheckingOms.value = false

    return
  }

  // checking loginOption.length to know if fetchLoginOptions API returned data
  // as toggleOmsInput is called twice without this check, from fetchLoginOptions and
  // through setOms (here) again
  if(Object.keys(loginOption.value).length && loginOption.value.loginAuthType !== "BASIC") {
    window.location.href = `${loginOption.value.loginAuthUrl}?relaystate=${window.location.origin}/login` // passing launchpad login URL
  } else {
    toggleOmsInput()
  }
  isCheckingOms.value = false
}

async function login(params?: any) {
  if((!username.value || !password.value) && !params?.token) {
    showToast(translate("Please fill in the user details"));

    return
  }

  isLoggingIn.value = true;
  try {
    await useAuth().login(username.value?.trim(), password.value, params?.token, params?.expirationTime)
    if(userStore.getRedirectUrl) {
      generateRedirectionLink()
    } else {
      // All the failure cases are handled in action, if then block is executing, login is successful
      username.value = ""
      password.value = ""
      router.push("/")
    }
  } catch (error) {
    logger.error("User [Context: launchpad] - Unexpected error occurred", error);
  }
  isLoggingIn.value = false;
}

function generateRedirectionLink() {
  const enteredOms = userStore.oms || cookieHelper().get("oms") || ""
  let omsUrl = getOmsLinkParam(enteredOms)
  const maarg = commonUtil.getMaargBaseURL()
  let omsRedirectionUrl = ""

  if(userStore.isMoquiOnly && !isMaargLogin(userStore.getRedirectUrl)) {
    // A Moqui-only OMS has no OFBiz side: the instance is both the oms and the maarg
    omsUrl = maarg as string
  }

  if(isMaargLogin(userStore.getRedirectUrl)) {
    if(maarg) {
      omsUrl = commonUtil.getMaargBaseURL() as string
    } else {
      showToast(translate("This application is not enabled for your account"))
      router.push("/")

      return;
    }
    omsRedirectionUrl = enteredOms
  }

  if(isOmsWithMaarg(userStore.getRedirectUrl) && commonUtil.getMaargURL()) {
    omsRedirectionUrl = commonUtil.getMaargBaseURL() as string
  }

  let url = userStore.getRedirectUrl
  const app = appInfo.find((app: any) => url.includes(app.handle))!

  // Replacing legacy from the url, so to easily handle the redirection
  url = url.replaceAll("-legacy", "")

  // Only an app with a legacy version falls back to it for a missing new permission
  if(app && app.appLegacyPermission && hasPermission(app.appLegacyPermission) || (app && app.appLegacyPermission && app.appPermission && !hasPermission(app.appPermission))) {
    if(url.includes("-uat.hotwax.io") || url.includes("-dev.hotwax.io")) {
      url = url.replace("-uat.hotwax.io", "-legacy-uat.hotwax.io").replace("-dev.hotwax.io", "-legacy-dev.hotwax.io")
    } else {
      url = url.replace(".hotwax.io", "-legacy.hotwax.io")
    }
  }

  const urlObj = new URL(url);

  const params = {
    oms: omsUrl,
    token: cookieHelper().get("token"),
    expirationTime: cookieHelper().get("expirationTime"),
  } as Record<string, string>;

  if(omsRedirectionUrl) {
    params.omsRedirectionUrl = omsRedirectionUrl
  }

  urlObj.search = new URLSearchParams(params).toString();

  window.location.replace(toLocalAppUrl(urlObj.toString()));
}
</script>

<style scoped>
.login-container {
  width: 375px;
}

.flex {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
</style>
