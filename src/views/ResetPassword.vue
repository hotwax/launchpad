<template>
  <ion-page>
    <ion-content>
      <div class="flex">
        <form class="login-container" @keyup.enter="resetPassword()" @submit.prevent v-if="!passwordResetSuccess">
          <Logo />
          <section>
            <ion-note class="ion-margin-bottom flex" color="dark">{{ $t('Finish resetting your password') }}</ion-note>

            <ion-item lines="full">
              <ion-label class="" position="fixed">{{ $t("New Password") }}</ion-label>
              <ion-input autocomplete="new-password" @ionFocus="errorMessage = ''" name="newPassword" v-model="newPassword" id="newPassword" :type="showNewPassword ? 'text' : 'password'" />
              <ion-button fill="clear" @click="showNewPassword = !showNewPassword">
                <ion-icon :icon="showNewPassword ? eyeOutline : eyeOffOutline"/>
              </ion-button>
            </ion-item>
            <ion-item lines="none">
              <ion-label class="" position="fixed">{{ $t("Confirm Password") }}</ion-label>
              <ion-input @ionFocus="errorMessage = ''" name="confirmPassword" v-model="confirmPassword" id="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'"/>
              <ion-button fill="clear" @click="showConfirmPassword = !showConfirmPassword">
                <ion-icon :icon="showConfirmPassword ? eyeOutline : eyeOffOutline"/>
              </ion-button>
            </ion-item>

            <div class="ion-padding">
              <ion-button color="primary" expand="block" @click.prevent="resetPassword()" @keyup.enter.stop>
                {{ $t("Reset Password") }}
              </ion-button>
            </div>

            <ion-item lines="none" v-show="errorMessage">
              <ion-icon color="danger" slot="start" :icon="closeCircleOutline" />
              <ion-label class="ion-text-wrap">{{ errorMessage }}</ion-label>
            </ion-item>
          </section>
        </form>
        <div v-else class="login-container">
          <Logo />
          <ion-text class="flex" >
            {{ $t('Your password has been successfully reset.') }}
          </ion-text>
          <div class="ion-padding flex">
            <ion-button @click="goToLogin">{{ $t('Login') }}</ion-button>
          </div>
      </div>
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
  IonNote,
  IonPage
} from "@ionic/vue";
import { defineComponent } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/store/auth";
import Logo from '@/components/Logo.vue';
import { closeCircleOutline, eyeOutline, eyeOffOutline, gridOutline } from 'ionicons/icons'
import { UserService } from '@/services/UserService'
import { hasError } from "@/adapter";
export default defineComponent({
  name: "ResetPassword",
  components: {
    IonButton,
    IonContent,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonNote,
    IonPage,
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
      isUsernameEmpty: false,
      errorMessage: '',
      passwordResetSuccess: false
    };
  },
  ionViewWillLeave() {
    // reset values to default, as we are using router.push to move to specific page and thus component does not gets unmount
    this.errorMessage = ''
    this.newPassword = ''
    this.confirmPassword = ''
    this.showConfirmPassword = false
    this.showNewPassword = false
    this.passwordMatchError = false
    this.isUsernameEmpty = false
    this.passwordResetSuccess = false
  },
  methods: {
    async resetPassword() {
      if(this.newPassword !== this.confirmPassword) {
        this.errorMessage = 'Passwords do not match. Please try again'
        return;
      }
      const params = {
        newPassword: this.newPassword,
        newPasswordVerify: this.confirmPassword
      }
      let resp: any;
      try {
        resp = await UserService.resetPassword(params);
        if(!hasError(resp) && resp?.data?.successMessage) {
          // once password is changed, resetting the value to false
          this.authStore.requirePasswordChange = false;
          this.passwordResetSuccess = true
        } else {
          throw resp.data;
        }
      } catch(err: any) {
        this.errorMessage = 'Failed to reset password, please try again and follow the instructions for creating a new password.'
        console.error('Failed to reset password', err)
      }
    },
    goToLogin(){
      this.router.push('/login')
    }
  },
  setup () {
    const router = useRouter();
    const authStore = useAuthStore();
    return {
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