<template>
  <ion-page>
    <ion-content>
      <div class="flex">
        <form class="login-container" @keyup.enter="resetPassword()" @submit.prevent v-if="!passwordResetSuccess">
          <Logo />
          <section>
            <ion-note class="ion-margin-bottom flex" color="dark">{{ $t('Finish resetting your password') }}</ion-note>

            <ion-item lines="full">
              <ion-input required autocomplete="new-password" :label="$t('New Password')" label-placement="floating" @ionFocus="errorMessage = ''" name="newPassword" v-model="newPassword" id="newPassword" :type="showNewPassword ? 'text' : 'password'" />
              <ion-button slot="end" fill="clear" @click="showNewPassword = !showNewPassword">
                <ion-icon slot="icon-only" :icon="showNewPassword ? eyeOutline : eyeOffOutline"/>
              </ion-button>
            </ion-item>
            <ion-item lines="none">
              <ion-input @ionFocus="errorMessage = ''" :label="$t('Confirm Password')" label-placement="floating" name="confirmPassword" v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'"/>
              <ion-button slot="end" fill="clear" @click="showConfirmPassword = !showConfirmPassword">
                <ion-icon slot="icon-only" :icon="showConfirmPassword ? eyeOutline : eyeOffOutline"/>
              </ion-button>
            </ion-item>

            <ion-button class="ion-padding" color="primary" expand="block" @click.prevent="resetPassword()" @keyup.enter.stop>
              {{ $t("Reset Password") }}
            </ion-button>

            <ion-item lines="none" v-show="errorMessage">
              <ion-icon color="danger" slot="start" :icon="closeCircleOutline" />
              <ion-label class="ion-text-wrap">{{ errorMessage }}</ion-label>
            </ion-item>
          </section>
        </form>
        <div v-else class="login-container ion-text-center">
          <Logo />
          <ion-label>
            {{ $t('Your password has been successfully reset') }}
          </ion-label>
          <ion-button class="ion-margin" @click="goToLogin">{{ $t('Login') }}</ion-button>
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
      showConfirmPassword: false,
      showNewPassword: false,
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
    this.passwordResetSuccess = false
  },
  methods: {
    async resetPassword() {
      if (!this.newPassword.trim() || !this.confirmPassword.trim()) {
        this.errorMessage = 'Fill all the required fields and try again.'
        return;
      }
      if(this.newPassword.trim() !== this.confirmPassword.trim()) {
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
        this.errorMessage = this.$t('Failed to reset password, please try again and follow the instructions for creating a new password.')
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
