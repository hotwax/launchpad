<template>
  <ion-page>
    <ion-content>
      <div class="flex">
        <form class="login-container" @keyup.enter="login()" @submit.prevent="login()">
          <Logo />

          <div class="ion-text-center ion-margin-bottom">
            <ion-chip :outline="true" @click="router.push('/oms')">
              {{ authStore.getOMS }}
            </ion-chip>
          </div>

          <ion-item lines="full">
            <ion-label position="fixed">{{ $t("Username") }}</ion-label>
            <ion-input name="username" v-model="username" id="username"  type="text" required></ion-input>
          </ion-item>
          <ion-item lines="none">
            <ion-label position="fixed">{{ $t("Password") }}</ion-label>
            <ion-input name="password" v-model="password" id="password" type="password" required></ion-input>
          </ion-item>

          <div class="ion-padding">
            <ion-button type="submit" color="primary" expand="block">
              {{ $t("Login") }}
              <ion-icon slot="end" :icon="arrowForwardOutline" />
            </ion-button>
          </div>
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
    };
  },
  mounted() {
    if (!this.authStore.getOMS.length) this.router.replace('/oms')
  },
  methods: {
    login() {
      const { username, password } = this;

      this.authStore.login(username.trim(), password).then(() => {
        // All the failure cases are handled in action, if then block is executing, login is successful
        this.username = ''
        this.password = ''
        if (this.$route.query?.redirectUrl) {
          // TODO upate the path from 'dxpLogin' to 'login'
          window.location.href = `${this.$route.query?.redirectUrl}?oms=${this.authStore.oms}&token=${this.authStore.token.value}&expirationTime=${this.authStore.token.expiration}`
        } else {
          this.router.push('/')
        }
      })
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