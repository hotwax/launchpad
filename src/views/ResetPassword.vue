<template>
  <ion-page>
    <ion-content>
      <div class="flex">
        <form class="login-container" @keyup.enter="resetPassword()" @submit.prevent="resetPassword()">
          <Logo />
          <section>
            <ion-item lines="full">
              <ion-label position="fixed">{{ $t("New Password") }}</ion-label>
              <ion-input @ionFocus="passwordMatchError = false" name="newPassword" v-model="newPassword" id="newPassword" :type="showNewPassword ? 'text' : 'password'" />
              <ion-note slot="error">Invalid email</ion-note>
              <ion-button fill="clear" @click="showNewPassword = !showNewPassword">
                <ion-icon :icon="showNewPassword ? eyeOutline : eyeOffOutline"/>
              </ion-button>
            </ion-item>
            <ion-item lines="none">
              <ion-label position="fixed">{{ $t("Confirm Password") }}</ion-label>
              <ion-input @ionFocus="passwordMatchError = false" name="confirmPassword" v-model="confirmPassword" id="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" error-text="Please enter password" />
              <ion-button fill="clear" @click="showConfirmPassword = !showConfirmPassword">
                <ion-icon :icon="showConfirmPassword ? eyeOutline : eyeOffOutline"/>
              </ion-button>
            </ion-item>

            <div class="ion-padding">
              <ion-button color="primary" expand="block" type="submit">
                {{ $t("Reset Password") }}
                <ion-icon slot="end" :icon="arrowForwardOutline" />
              </ion-button>
            </div>

            <ion-item lines="none" v-show="passwordMatchError">
              <ion-icon color="danger" slot="start" :icon="closeCircleOutline" />
              <ion-label>{{ $t('Passwords do not match. Please try again.') }}</ion-label>
            </ion-item>
          </section>
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
  IonPage,
  IonNote,
  loadingController
} from "@ionic/vue";
import { defineComponent } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import Logo from '@/components/Logo.vue';
import { arrowForwardOutline, closeCircleOutline, eyeOutline, eyeOffOutline, gridOutline } from 'ionicons/icons'
import { translate } from "@/i18n";
import { UserService } from '@/services/UserService'
import { hasError } from "@/adapter";

export default defineComponent({
  name: "Login",
  components: {
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonPage,
    IonNote,
    Logo
  },
  data () {
    return {
      loader: null as any,
      newPassword: '',
      confirmPassword: '',
      passwordMatchError: false,
      showConfirmPassword: false,
      showNewPassword: false,
      isUsernameEmpty: false
    };
  },
  methods: {
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
    async resetPassword() {
      if(this.newPassword !== this.confirmPassword) {
        this.passwordMatchError = true
        return;
      }

      const params = {
        newPassword: this.newPassword,
        newPasswordVerify: this.confirmPassword
      }

      try {
        const resp = await UserService.resetPassword(params);

        if(!hasError(resp) && resp?.data?.successMessage) {
          if (this.authStore.getRedirectUrl) {
            window.location.href = `${this.authStore.getRedirectUrl}?oms=${this.authStore.oms}&token=${this.authStore.token.value}&expirationTime=${this.authStore.token.expiration}`
          } else {
            this.router.push('/')
          }
        } else {
          throw resp.data;
        }
      } catch(err) {
        console.error('Failed to reset password', err)
      }
    }
  },
  setup () {
    const router = useRouter();
    const authStore = useAuthStore();
    return {
      arrowForwardOutline,
      authStore,
      closeCircleOutline,
      eyeOutline,
      eyeOffOutline,
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
