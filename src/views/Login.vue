<template>
  <ion-page>
    <ion-content>
      <div class="flex" v-if="!hideBackground && !isConfirmingForActiveSession">
        <form class="login-container" @keyup.enter="handleSubmit()" @submit.prevent>
          <Logo />
          <section v-if="showOmsInput">
            <ion-item lines="full">
              <ion-input :label="$t('OMS')" label-placement="fixed" name="instanceUrl" v-model="instanceUrl" id="instanceUrl" type="text" required />
            </ion-item>

            <div class="ion-padding">
              <!-- @keyup.enter.stop to stop the form from submitting on enter press as keyup.enter is already bound
              through the form above, causing both the form and the button to submit. -->
              <ion-button color="primary" expand="block" @click.prevent="setOms()" @keyup.enter.stop>
                {{ $t("Next") }}
                <ion-icon slot="end" :icon="arrowForwardOutline" />
              </ion-button>
            </div>
          </section>

          <section v-else>
            <div class="ion-text-center ion-margin-bottom">
              <ion-chip :outline="true" @click="toggleOmsInput()">
                {{ authStore.getOMS }}
              </ion-chip>
            </div>

            <ion-item lines="full">
              <ion-input :label="$t('Username')" label-placement="fixed" name="username" v-model="username" id="username"  type="text" required />
            </ion-item>
            <ion-item lines="none">
              <ion-input :label="$t('Password')" label-placement="fixed" name="password" v-model="password" id="password" type="password" required />
            </ion-item>

            <div class="ion-padding">
              <ion-button color="primary" expand="block" @click="login()">
                {{ $t("Login") }}
                <ion-icon slot="end" :icon="arrowForwardOutline" />
              </ion-button>
            </div>
          </section>
        </form>
      </div>
    
      <ion-fab @click="router.push('/')" vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button color="medium">
          <ion-icon :icon="gridOutline" /> 
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>


<script lang="ts">
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
  loadingController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import Logo from '@/components/Logo.vue';
import { arrowForwardOutline, gridOutline } from 'ionicons/icons'
import { UserService } from "@/services/UserService";
import { translate } from "@/i18n";
import { showToast } from "@/util";
import { hasError } from "@hotwax/oms-api";

export default defineComponent({
  name: "Login",
  components: {
    IonButton,
    IonChip,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonInput,
    IonItem,
    IonPage,
    Logo
  },
  data () {
    return {
      username: "",
      password: "",
      instanceUrl: "",
      baseURL: process.env.VUE_APP_BASE_URL,
      alias: process.env.VUE_APP_ALIAS ? JSON.parse(process.env.VUE_APP_ALIAS) : {},
      defaultAlias: process.env.VUE_APP_DEFAULT_ALIAS,
      showOmsInput: false,
      hideBackground: true,
      isConfirmingForActiveSession: false,
      loader: null as any,
      loginOption: {} as any
    };
  },
  ionViewWillEnter() {
    this.initialise()
  },
  methods: {
    async initialise() {
      this.hideBackground = true
      await this.presentLoader("Processing");

      // Run the basic login flow when oms and token both are found in query
      if (this.$route.query?.oms && this.$route.query?.token) {
        if(this.authStore.getRedirectUrl) {
          window.location.href = `${this.authStore.getRedirectUrl}?oms=${this.$route.query?.oms}&token=${this.$route.query?.token}`
        } else {
          await this.basicLogin()
          this.dismissLoader();
          return;
        }
      } else if (this.$route.query?.token) {
        // SAML login handling as only token will be returned in the query when login through SAML
        await this.samlLogin()
        this.dismissLoader();
        return
      }

      // logout from Launchpad if logged out from the app
      if (this.$route.query?.isLoggedOut === 'true') {
        // We will already mark the user as unuauthorised when log-out from the app
        this.authStore.logout({ isUserUnauthorised: true })
      }

      // fetch login options only if OMS is there as API calls require OMS
      if (this.authStore.getOMS) {
        await this.fetchLoginOptions()
      }

      // show OMS input if SAML if configured or if query or state does not have OMS
      if (this.loginOption.loginAuthType !== 'BASIC' || this.$route.query?.oms || !this.authStore.getOMS) {
        this.showOmsInput = true
      }

      // Update OMS input if found in query
      if (this.$route.query?.oms) {
        this.instanceUrl = this.$route.query.oms as string
      }

      // setting redirectUrl in the state
      if (this.$route.query?.redirectUrl) {
        this.authStore.setRedirectUrl(this.$route.query.redirectUrl as string)
      }

      // if a session is already active, login directly in the app
      if (this.authStore.isAuthenticated) {
        if(this.authStore.getRedirectUrl) {
          window.location.href = `${this.authStore.getRedirectUrl}?oms=${this.authStore.oms}&token=${this.authStore.token.value}&expirationTime=${this.authStore.token.expiration}`
        } else {
          this.router.push('/')
        }
      }

      this.instanceUrl = this.authStore.oms;
      if (this.authStore.oms) {
        // If the current URL is available in alias show it for consistency
        const currentInstanceUrlAlias = Object.keys(this.alias).find((key) => this.alias[key] === this.authStore.oms);
        currentInstanceUrlAlias && (this.instanceUrl = currentInstanceUrlAlias);
      }
      // If there is no current preference set the default one
      if (!this.instanceUrl && this.defaultAlias) {
        this.instanceUrl = this.defaultAlias;
      }
      this.dismissLoader();
      this.hideBackground = false
    },
    async presentLoader(message: string) {
      if (!this.loader) {
        this.loader = await loadingController
          .create({
            message: translate(message),
            translucent: true,
            backdropDismiss: false
          });
      }
      this.loader.present();
    },
    dismissLoader() {
      if (this.loader) {
        this.loader.dismiss();
        this.loader = null as any;
      }
    },
    toggleOmsInput() {
      this.showOmsInput = !this.showOmsInput
      // clearing username and password if moved to OMS input
      if (this.showOmsInput) this.username = this.password = ''
    },
    // on pressing Enter after inputting OMS, the form is submitted through the login method
    // handleSubmit will handle the flow based on the input values for OMS, username and password  
    handleSubmit() {
      if (this.instanceUrl.trim() && this.showOmsInput && (!this.username && !this.password)) this.setOms()
      else if (this.instanceUrl) this.login()
    },
    async setOms() {
      if (!this.instanceUrl) {
        showToast(translate('Please fill in the OMS'));
        return
      }

      const instanceURL = this.instanceUrl.trim().toLowerCase();
      if (!this.baseURL) this.authStore.setOMS(this.alias[instanceURL] ? this.alias[instanceURL] : instanceURL);

      // run SAML login flow if login options are configured for the OMS
      await this.fetchLoginOptions()

      // checking loginOption.length to know if fetchLoginOptions API returned data
      // as toggleOmsInput is called twice without this check, from fetchLoginOptions and
      // through setOms (here) again
      if (Object.keys(this.loginOption).length && this.loginOption.loginAuthType !== 'BASIC') {
        window.location.href = `${this.loginOption.loginAuthUrl}?relaystate=${window.location.origin}/login` // passing launchpad/login URL
      } else {
        this.toggleOmsInput()
      }
    },
    async fetchLoginOptions() {
      this.loginOption = {}
      try {
        const resp = await UserService.checkLoginOptions()
        if (!hasError(resp)) {
          this.loginOption = resp.data
        }
      } catch (error) {
        console.error(error)
      }
    },
    async login() {
      const { username, password } = this;
      if (!username || !password) {
        showToast(translate('Please fill in the user details'));
        return
      }

      try {
        await this.authStore.login(username.trim(), password)
        if (this.authStore.getRedirectUrl) {
          window.location.href = `${this.authStore.getRedirectUrl}?oms=${this.authStore.oms}&token=${this.authStore.token.value}&expirationTime=${this.authStore.token.expiration}`
        } else {
          // All the failure cases are handled in action, if then block is executing, login is successful
          this.username = ''
          this.password = ''
          this.router.push('/')
        }
      } catch (error) {
        console.error(error)
      }
    },
    async samlLogin() {
      try {
        const { token, expirationTime } = this.$route.query as any
        await this.authStore.samlLogin(token, expirationTime)
        if (this.authStore.getRedirectUrl) {
          window.location.href = `${this.authStore.getRedirectUrl}?oms=${this.authStore.oms}&token=${this.authStore.token.value}&expirationTime=${this.authStore.token.expiration}`
        } else {
          this.router.push('/')
        }
      } catch (error) {
        this.router.push('/')
        console.error(error)
      }
    },
    async basicLogin() {
      try {
        const { oms, token, expirationTime } = this.$route.query as any
        await this.authStore.setOMS(oms);

        // Setting token previous to getting user-profile, if not then the client method honors the state token
        await this.authStore.setToken(token, expirationTime)

        const current = await UserService.getUserProfile(token);
        await this.authStore.setCurrent(current)
      } catch (error) {
        showToast(translate('Failed to fetch user-profile, please try again'));
        console.error("error: ", error);
      }
      this.router.replace('/')
    }
  },
  setup () {
    const router = useRouter();
    const authStore = useAuthStore();
    return {
      arrowForwardOutline,
      authStore,
      gridOutline,
      router
    };
  }
});
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
