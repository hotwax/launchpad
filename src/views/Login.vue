<template>
  <ion-page>
    <ion-content>
      <div class="flex" v-if="!hideBackground && !isConfirmingForActiveSession">
        <form class="login-container" @keyup.enter="handleSubmit()" @submit.prevent="handleSubmit()">
          <Logo />
          <section v-if="showOmsInput">
            <ion-item lines="full">
              <ion-label position="fixed">{{ $t("OMS") }}</ion-label>
              <ion-input name="instanceUrl" v-model="instanceUrl" id="instanceUrl"  type="text" required />
            </ion-item>

            <div class="ion-padding">
              <ion-button color="primary" expand="block" @click="setOms()">
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
              <ion-label position="fixed">{{ $t("Username") }}</ion-label>
              <ion-input name="username" v-model="username" id="username"  type="text" required />
            </ion-item>
            <ion-item lines="none">
              <ion-label position="fixed">{{ $t("Password") }}</ion-label>
              <ion-input name="password" v-model="password" id="password" type="password" required />
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
    </ion-content>
  </ion-page>
</template>


<script lang="ts">
import {
  alertController,
  IonButton,
  IonChip,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  loadingController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import Logo from '@/components/Logo.vue';
import { arrowForwardOutline } from 'ionicons/icons'
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
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
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
      loader: null as any
    };
  },
  ionViewWillEnter() {
    this.initialise()
  },
  methods: {
    async initialise() {
      this.hideBackground = true
      await this.presentLoader("Processing");
      // SAML login handling as only token will be returned in the query
      if (this.$route.query?.token) {
        await this.samlLogin()
        this.dismissLoader();
        return
      }

      // show OMS input field if query has OMS or if both query and state does not have OMS
      if (this.$route.query?.oms || this.authStore.getOMS) {
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

      // if a session is already active, present alerts based on redirectUrl being sent
      await this.handleActiveSessionLogin()
      
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

      let loginOption = {} as any
      // handling if API does not exist
      try {
        const resp = await UserService.checkLoginOptions()
        if (!hasError(resp)) {
          loginOption = resp.data
          // only perform SSO login if it is configured and redirect URL is there
          if (loginOption && loginOption.loginAuthType !== 'BASIC') {
            window.location.href = `${loginOption.loginAuthUrl}?relaystate=${window.location.origin}/login` // passing launchpad/login URL
          } else {
            this.toggleOmsInput()
          }
        }
      } catch (error) {
        console.error(error)
        // Fallback TODO Remove this
        this.toggleOmsInput()
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
        console.error(error)
      }
    },
    async handleActiveSessionLogin() {
      if (this.authStore.isAuthenticated) {
        // optional true parameter for redirectUrl case
        if (this.$route.query?.redirectUrl) await this.confirmActiveSessionLogin(true)
        else await this.confirmActiveSessionLogin()
      }
    },
    async confirmActiveSessionLogin(redirect?: boolean) {
      this.isConfirmingForActiveSession = true
      const alert = await alertController
        .create({
          translucent: true,
          backdropDismiss: false,
          header: translate('Already active session'),
          message: translate(`A session for is already active for. Do you want to continue or login again?`, { partyName: this.authStore.current.partyName, oms: this.authStore.getOMS }),
          buttons: [{
            text: translate('Continue'),
            handler: () => {
              redirect
                ? window.location.href = `${this.authStore.getRedirectUrl}?oms=${this.authStore.oms}&token=${this.authStore.token.value}&expirationTime=${this.authStore.token.expiration}`
                : this.router.push('/')
              this.isConfirmingForActiveSession = false;
            }
          }, {
            text: translate('Re-login'),
            handler: async () => {
              const redirectUrl = this.authStore.getRedirectUrl
              await this.authStore.logout()
              // re-set the redirectUrl if redirect flow was called
              // as it got cleared on logout
              if (redirect) this.authStore.setRedirectUrl(redirectUrl)
              this.isConfirmingForActiveSession = false;
            }
          }]
        });
      return alert.present();
    }
  },
  setup () {
    const router = useRouter();
    const authStore = useAuthStore();
    return {
      arrowForwardOutline,
      authStore,
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