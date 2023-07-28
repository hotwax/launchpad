<template>
  <ion-page>
    <ion-content>
      <div class="flex">
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
  IonButton,
  IonChip,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonPage
} from "@ionic/vue";
import { defineComponent } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import Logo from '@/components/Logo.vue';
import { arrowForwardOutline } from 'ionicons/icons'
import { confirmActiveSessionLogin } from "@/auth-util";
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
      showOmsInput: false
    };
  },
  async mounted() {    
    this.initialiseToggleOmsInputVal()

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
  },
  methods: {
    toggleOmsInput() {
      this.showOmsInput = !this.showOmsInput
      // clearing username and password if moved to OMS input
      if (this.showOmsInput) this.username = this.password = ''
      return this.showOmsInput
    },
    initialiseToggleOmsInputVal() {
      // show OMS input field if query has OMS or if both query and state does not have OMS
      if (this.$route.query?.oms || (!this.$route.query?.oms?.length && !this.authStore.getOMS)) {
        this.showOmsInput = true
      }
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
        const resp = await UserService.checkLoginOptions(this.authStore.getOMS)
        if (!hasError(resp)) loginOption = resp
      } catch (error) {
        console.error(error)
      }

      // only perform SSO login if it is configured and redirect URL is there
      if (this.authStore.getRedirectUrl && loginOption.loginAuthType !== 'BASIC') {
        const authUrl = `${loginOption.loginAuthUrl}?relaystate=${window.location.href}` // passing launchpad/login URL 
        this.authStore.prepareSamlLogin(authUrl).then(() => {
          window.location.href = `${this.authStore.getRedirectUrl}?oms=${this.authStore.oms}&token=${this.authStore.token.value}&expirationTime=${this.authStore.token.expiration}`
        })
      } else {
        this.toggleOmsInput()
      }
    },
    login() {
      const { username, password } = this;
      if (!username || !password) {
        showToast(translate('Please fill in the user details'));
        return
      }

      this.authStore.login(username.trim(), password).then(() => {
        // All the failure cases are handled in action, if then block is executing, login is successful
        this.username = ''
        this.password = ''
        if (this.authStore.getRedirectUrl) {
          window.location.href = `${this.authStore.getRedirectUrl}?oms=${this.authStore.oms}&token=${this.authStore.token.value}&expirationTime=${this.authStore.token.expiration}`
        } else {
          this.router.push('/')
        }
      })
    },
    async handleActiveSessionLogin() {
      if (this.authStore.isAuthenticated) {
        // optional true parameter for redirectUrl case
        if (this.$route.query?.redirectUrl) await confirmActiveSessionLogin(true)
        else await confirmActiveSessionLogin()
      }
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