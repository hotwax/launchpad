<template>
  <ion-page>
    <ion-content>
      <div v-if="!isInitializing && !isConfirmingForActiveSession" class="flex">
        <form class="login-container" @keyup.enter="handleSubmit()" @submit.prevent>
          <Logo />
          <section v-if="showOmsInput">
            <ion-item lines="full">
              <ion-input id="instanceUrl" v-model="instanceUrl" :label="translate('OMS')" label-placement="fixed" name="instanceUrl" type="text" required />
            </ion-item>

            <div class="ion-padding">
              <!-- @keyup.enter.stop to stop the form from submitting on enter press as keyup.enter is already bound
              through the form above, causing both the form and the button to submit. -->
              <ion-button color="primary" expand="block" @click.prevent="isCheckingOms ? '' : setOms()" @keyup.enter.stop>
                {{ translate("Next") }}
                <ion-spinner v-if="isCheckingOms" slot="end" name="crescent" />
                <ion-icon v-else slot="end" :icon="arrowForwardOutline" />
              </ion-button>
            </div>
          </section>

          <section v-else>
            <div class="ion-text-center ion-margin-bottom">
              <ion-chip :outline="true" @click="toggleOmsInput()">
                {{ cookieHelper().get("oms") }}
              </ion-chip>
            </div>

            <ion-item lines="full">
              <ion-input id="username" v-model="username" :label="translate('Username')" label-placement="fixed" name="username" type="text" required />
            </ion-item>
            <ion-item lines="none">
              <ion-input id="password" v-model="password" :label="translate('Password')" label-placement="fixed" name="password" type="password" required />
            </ion-item>

            <div class="ion-padding">
              <ion-button color="primary" expand="block" @click="isLoggingIn ? '' : login()">
                {{ translate("Login") }}
                <ion-spinner v-if="isLoggingIn" slot="end" name="crescent" />
                <ion-icon v-else slot="end" :icon="arrowForwardOutline" />
              </ion-button>
            </div>
          </section>
        </form>
      </div>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end" @click="router.push('/')">
        <ion-fab-button color="medium">
          <ion-icon :icon="gridOutline" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>


<script setup lang="ts">
import { commonUtil, cookieHelper, logger, translate } from "@common";
import {
  IonButton,
  IonChip,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonInput,
  IonItem,
  IonPage,
  IonSpinner,
  loadingController,
  onIonViewWillEnter
} from "@ionic/vue"
import { arrowForwardOutline, gridOutline } from "ionicons/icons"
import { ref } from "vue";
import Logo from "@/components/Logo.vue"
import { useAuth } from "@/composables/auth"
import { useUserStore } from "@/store/user"
import { appInfo, isMaargLogin, isOmsWithMaarg, showToast } from "@/util"
import router from "../router"

const route = router.currentRoute.value;
const userStore = useUserStore();
const { clearAuth, fetchLoginOptions, isAuthenticated, logout, loginOption, updateToken } = useAuth();

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

onIonViewWillEnter(() => {
  initialise()
})

async function initialise() {
  isInitializing.value = true
  await presentLoader("Processing")

  // Run the basic login flow when oms and token both are found in query
  if(route.query?.oms && route.query?.token) {
    await basicLogin()
    dismissLoader();

    return;
  } else if(route.query?.token) {
    // SAML login handling as only token will be returned in the query when login through SAML
    await samlLogin()
    dismissLoader();

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
    await logout(isMaargLogin(route.query.redirectUrl as string) ? {} : { isUserUnauthorised: true })
  }

  // fetch login options only if OMS is there as API calls require OMS
  if(cookieHelper().get("oms")) {
    await fetchLoginOptions()
  }

  // show OMS input if SAML if configured or query or state does not have OMS
  if(loginOption.value.loginAuthType !== "BASIC" || route.query?.oms || !cookieHelper().get("OMS")) {
    showOmsInput.value = true
  }

  // Update OMS input if found in query
  if(route.query?.oms) {
    instanceUrl.value = route.query.oms as string
  }

  // setting redirectUrl in the state
  if(route.query?.redirectUrl) {
    userStore.setRedirectUrl(route.query.redirectUrl as string)
  }

  // if a session is already active, login directly in the app
  if(isAuthenticated.value) {
    if(userStore.getRedirectUrl) {
      await userStore.fetchPermissions();
      generateRedirectionLink();
    } else {
      router.push("/")
    }
  }

  instanceUrl.value = commonUtil.getOMSInstanceName();
  if(commonUtil.getOMSInstanceName()) {
    // If the current URL is available in alias show it for consistency
    const currentInstanceUrlAlias = Object.keys(alias).find((key) => alias[key] === commonUtil.getOMSInstanceName());
    if(currentInstanceUrlAlias) {
      instanceUrl.value = currentInstanceUrlAlias
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

  isCheckingOms.value = true

  const instanceURL = instanceUrl.value.trim().toLowerCase();
  cookieHelper().set("oms", alias[instanceURL] ? alias[instanceURL] : instanceURL)

  // run SAML login flow if login options are configured for the OMS
  await fetchLoginOptions()

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

async function login() {
  if(!username.value || !password.value) {
    showToast(translate("Please fill in the user details"));

    return
  }

  isLoggingIn.value = true;
  try {
    await useAuth().login(username.value.trim(), password.value)
    if(userStore.getRedirectUrl) {
      generateRedirectionLink()
    } else {
      // All the failure cases are handled in action, if then block is executing, login is successful
      username.value = ""
      password.value = ""
      router.push("/")
    }
  } catch (error) {
    logger.error(error)
  }
  isLoggingIn.value = false;
}

async function samlLogin() {
  try {
    const { token, expirationTime } = route.query as any
    await userStore.samlLogin(token, expirationTime)
    if(userStore.getRedirectUrl) {
      generateRedirectionLink();
    } else {
      router.push("/")
    }
  } catch (error) {
    router.push("/")
    logger.error(error)
  }
}

async function basicLogin() {
  try {
    const { oms, token, expirationTime } = route.query as any
    // Clear the previously stored oms and token when having oms and token in the URL
    clearAuth()
    cookieHelper().set("oms", oms)

    // checking for login options as we need to get maarg instance URL for accessing specific apps
    await fetchLoginOptions()

    updateToken(token, expirationTime)

    await userStore.fetchUserProfile();
    await userStore.fetchPermissions();
  } catch (error) {
    updateToken("", "")
    showToast(translate("Failed to fetch user-profile, please try again"));
    logger.error("error: ", error);
  }
  router.replace("/")
}

function generateRedirectionLink() {
  let omsUrl = commonUtil.getOmsURL()
  const maarg = commonUtil.getMaargBaseURL()
  let omsRedirectionUrl = ""

  if(isMaargLogin(userStore.getRedirectUrl)) {
    if(maarg) {
      omsUrl = commonUtil.getMaargBaseURL() as string
    } else {
      showToast(translate("This application is not enabled for your account"))
      router.push("/")

      return;
    }
    omsRedirectionUrl = commonUtil.getOmsURL()
  }

  if(isOmsWithMaarg(userStore.getRedirectUrl) && commonUtil.getMaargURL()) {
    omsRedirectionUrl = commonUtil.getMaargBaseURL() as string
  }

  let url = userStore.getRedirectUrl
  const app = appInfo.find((app: any) => url.includes(app.handle))!

  // Replacing legacy from the url, so to easily handle the redirection
  url = url.replaceAll("-legacy", "")

  if(app && app.appLegacyPermission && hasPermission(app.appLegacyPermission) || (app && app.appPermission && !hasPermission(app.appPermission))) {
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

  if(maarg) {
    params.maarg = maarg;
  }

  if(omsRedirectionUrl) {
    params.omsRedirectionUrl = omsRedirectionUrl
  }

  urlObj.search = new URLSearchParams(params).toString();

  window.location.replace(urlObj.toString());
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
