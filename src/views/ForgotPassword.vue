<template>
  <ion-page>
    <ion-content>
      <div class="flex">
        <form id="forgotPasswordForm" class="login-container" @keyup.enter="forgotPassword()" @submit.prevent="forgotPassword()">
          <Logo />
          <section>
            <ion-item lines="full">
              <ion-label position="fixed">{{ $t("Username") }}</ion-label>
              <ion-input @ionFocus="errorMessage = ''" name="username" v-model="username" id="username" type="text" />
            </ion-item>
            <ion-item lines="none">
              <ion-label position="fixed">{{ $t("Email") }}</ion-label>
              <ion-input @ionFocus="errorMessage = ''" name="email" v-model="email" id="email" type="email"/>
            </ion-item>

            <div class="ion-padding">
              <ion-button name="forgotPasswordForm" color="primary" expand="block" type="submit">
                {{ $t("Send Reset Link") }}
              </ion-button>
            </div>

            <ion-item lines="none" v-show="errorMessage">
              <ion-icon color="danger" slot="start" :icon="closeCircleOutline" />
              <ion-label class="ion-text-wrap">{{ $t(errorMessage) }}</ion-label>
            </ion-item>

            <ion-item lines="none" v-show="successMessage">
              <ion-icon color="danger" slot="start" :icon="checkmarkCircleOutline" />
              <ion-label class="ion-text-wrap">{{ $t(successMessage) }}</ion-label>
            </ion-item>
          </section>
          <ion-button name="loginButton" fill="clear" class="ion-text-center" @click.stop="router.push('/login')">{{ $t('Login') }}</ion-button>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>


<script lang="ts">
import {
  IonButton,
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
import { checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons'
import { hasError } from "@/adapter";
import { UserService } from "@/services/UserService"

export default defineComponent({
  name: "ForgotPassword",
  components: {
    IonButton,
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
      username: '',
      email: '',
      errorMessage: '',
      successMessage: ''
    };
  },
  ionViewWillLeave() {
    // clearning the data on page leave
    this.username = ''
    this.email = ''
    this.errorMessage = ''
    this.successMessage = ''
  },
  methods: {
    async forgotPassword() {

      if(!this.username.trim() || !this.email.trim()) {
        this.errorMessage = 'Username or Email cannot be empty, please fill both the fields.'
        return;
      }

      const params = {
        userName: this.username,
        emailAddress: this.email
      }

      try {
        const resp = await UserService.forgotPassword(params);

        if(!hasError(resp)) {
          this.successMessage = `Your request for reset password has been processed. Please check your email ${this.email}, for further instructions.`
        } else {
          this.errorMessage = resp.data._ERROR_MESSAGE_
        }
      } catch(err) {
        this.errorMessage = 'Failed to send password reset link, please try again or contact administrator.'
        console.error(err)
      }
    }
  },
  setup () {
    const router = useRouter();
    const authStore = useAuthStore();
    return {
      authStore,
      checkmarkCircleOutline,
      closeCircleOutline,
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
