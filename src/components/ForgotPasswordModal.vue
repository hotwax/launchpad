<template>
  <ion-header>
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-button @click="closeModal">
          <ion-icon slot="icon-only" :icon="closeOutline" />
        </ion-button>
      </ion-buttons>
      <ion-title>{{$t("Reset password")}}</ion-title>
    </ion-toolbar>
  </ion-header>
  <ion-content>
    <ion-item lines="none">
      <ion-input ref="username" @ionInput="clearMessages" :label="$t('Username')" name="username" :placeholder="$t('Enter username')" v-model="username" id="username" type="text" @keyup.enter="forgotPassword" :error-text="errorMessage"/>
    </ion-item>

    <ion-item lines="none" class="ion-margin-vertical">
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
import { showToast } from '@/util';

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
  data() {
    return {
      username: '',
      errorMessage: '',
    }
  },
  methods:{
    closeModal() {
      modalController.dismiss({ dismissed: true });
    },
    clearMessages() {
      this.errorMessage = "";
      (this as any).$refs.username.$el.classList.add('ion-touched');
      (this as any).$refs.username.$el.classList.remove('ion-invalid');
    },
    async forgotPassword() {
      if (!this.username.trim()) {
        this.errorMessage = this.$t('Username cannot be empty.');
        (this as any).$refs.username.$el.classList.add('ion-invalid');
        return;
      }

      try {
        const resp = await UserService.forgotPassword({
          userName: this.username
        });

        if (!hasError(resp)) {
          this.errorMessage = '';
          showToast(resp.data._EVENT_MESSAGE_)
          this.closeModal()
        } else {
          throw resp.data._ERROR_MESSAGE_;
        }
      } catch (err) {
        this.errorMessage = this.$t('Failed to send password reset link, please try again or contact administrator.');
        (this as any).$refs.username.$el.classList.add('ion-invalid');
        console.error(err);
      }
    },
  },
  setup() {
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