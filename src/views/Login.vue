<template>
  <ion-page>
    <ion-content>
      <div class="flex">
        <form class="login-container" @keyup.enter="login(form)" @submit.prevent="login(form)">
          <Logo />

          <div class="ion-text-center ion-margin-bottom">
            <ion-chip :outline="true" @click="router.replace('/oms')">
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
            <ion-button type="submit" color="primary" expand="block">{{ $t("Login") }}</ion-button>
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
  IonInput,
  IonItem,
  IonLabel,
  IonPage
} from "@ionic/vue";
import { defineComponent } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import Logo from '@/components/Logo.vue';

export default defineComponent({
  name: "Login",
  components: {
    IonButton,
    IonChip,
    IonContent,
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
    login: function () {
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
      router,
      authStore
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