<template>
  <ion-page>
    <ion-content>
      <div class="flex">
        <form class="login-container" @keyup.enter="next()" @submit.prevent="next()">
          <Logo />

          <ion-item lines="full" v-if="!baseURL">
            <ion-label position="fixed">{{ $t("OMS") }}</ion-label>
            <ion-input name="instanceUrl" v-model="instanceUrl" id="instanceUrl"  type="text" required />
          </ion-item>

          <div class="ion-padding">
            <ion-button type="submit" color="primary" expand="block">
              {{ $t("Next") }}
              <ion-icon slot="end" :icon="arrowForwardOutline" />
            </ion-button>
          </div>
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
  IonContent,
  IonFab,
  IonFabButton,
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
import { arrowForwardOutline, gridOutline } from 'ionicons/icons'
import { UserService } from "@/services/UserService";
import { handleActiveSessionOnLogin } from '@/auth-util'

export default defineComponent({
  name: "OMS",
  components: {
    IonButton,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonPage,
    Logo
  },
  data () {
    return {
      instanceUrl: "",
      baseURL: process.env.VUE_APP_BASE_URL,
      alias: process.env.VUE_APP_ALIAS ? JSON.parse(process.env.VUE_APP_ALIAS) : {},
      defaultAlias: process.env.VUE_APP_DEFAULT_ALIAS,
    };
  },
  async mounted() {
    // setting redirectUrl in the state
    if (this.$route.query?.redirectUrl) {
      this.authStore.setRedirectUrl(this.$route.query.redirectUrl as string)
    }
    
    // if a session is already active, present alerts based on redirectUrl being sent
    if (this.authStore.isAuthenticated) {
      // optional true parameter for redirectUrl case
      if (this.$route.query?.redirectUrl) await handleActiveSessionOnLogin(true)
      else await handleActiveSessionOnLogin()
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
  },
  methods: {
    async next() {
      const instanceURL = this.instanceUrl.trim().toLowerCase();
      if (!this.baseURL) this.authStore.setOMS(this.alias[instanceURL] ? this.alias[instanceURL] : instanceURL);

      // only perform SSO login if it is configured and redirect URL is there
      if (this.authStore.getRedirectUrl && await UserService.isSamlLoginConfigured(this.authStore.getOMS)) {
        this.authStore.prepareSamlLogin(this.authStore.getRedirectUrl).then(() => {
          window.location.href = `${this.authStore.getRedirectUrl}?oms=${this.authStore.oms}&token=${this.authStore.token.value}&expirationTime=${this.authStore.token.expiration}`
        })
      } else {
        this.router.push('/login')
      }
    }
  },
  setup () {
    const router = useRouter();
    const authStore = useAuthStore();
    return {
      arrowForwardOutline,
      authStore,
      gridOutline,
      router,
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