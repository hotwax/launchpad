<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{$t("Reset Password")}}</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">
    <ion-item lines="full">
      <ion-input @ionFocus="clearMessages" :label="$t('Username')" name="username" v-model="username" id="username" type="text" />
    </ion-item>
    <ion-text color="danger" v-if="errorMessage">
      <p class="ion-padding-start">{{ errorMessage }}</p>
    </ion-text>
    <ion-text color="success" v-if="successMessage">
      <p class="ion-padding-start">{{ successMessage }}</p>
    </ion-text>

    <ion-item lines="none" class="ion-margin-vertical ion-padding-vertical">
        <ion-icon :icon="informationOutline" size="medium" slot="start"></ion-icon>
        <ion-label >{{ $t("Your username must have an email already associated with it in HotWax to receive a reset password email. If you do not have an email linked to your account already, please contact your administrator to manually reset your password.") }}</ion-label>
    </ion-item>
      
    <ion-fab vertical="bottom" horizontal="end" slot="fixed">
      <ion-fab-button @click="forgotPassword">
        <ion-icon :icon="sendOutline" />
      </ion-fab-button>
    </ion-fab>
  </ion-content>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
  IonItem,
  IonLabel,
  IonFab,
  IonFabButton,
  modalController,
  IonInput
} from '@ionic/vue';
import { closeOutline, informationOutline, sendOutline } from 'ionicons/icons';
import { UserService } from '@/services/UserService';
import { hasError } from '@hotwax/oms-api';
import { useRouter } from 'vue-router';

export default defineComponent({
  name:'ForgotPasswordModal',
  components:{
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonTitle,
    IonToolbar,
    IonItem,
    IonLabel,
    IonFab,
    IonFabButton,
    IonInput
  },
  data(){
    return {
      username:'',
      errorMessage:'',
      successMessage:''
    }
  },
  methods:{
    closeModal() {
      modalController.dismiss({ dismissed: true });
    },
    clearMessages(){
      this.errorMessage = ""
      this.successMessage = ""
    },
    async forgotPassword() {
      if (!this.username.trim()) {
        this.errorMessage = this.$t('Username cannot be empty.');
        this.successMessage = '';
        return;
      }

      const params = {
        userName: this.username,
      };

      try {
        const resp = await UserService.forgotPassword(params);

        if (!hasError(resp)) {
          this.successMessage = this.$t(
            'Your request for reset password has been processed. Please check your email, for further instructions.'
          );
          this.errorMessage = '';
          this.router.push('/resetPassword')
        } else {
          throw resp.data._ERROR_MESSAGE_;
        }
      } catch (err) {
        this.errorMessage = this.$t(
          'Failed to send password reset link, please try again or contact administrator.'
        );
        this.successMessage = '';
        console.error(err);
      }
    },
  },
  setup(){
    const router = useRouter()
    return {
      closeOutline,
      informationOutline,
      sendOutline,
      router
    }
  }
})
</script>