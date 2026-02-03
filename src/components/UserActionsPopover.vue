<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ authStore.current?.partyName ? authStore.current.partyName : authStore.current.userLoginId }}</ion-list-header>

      <ion-item button @click="redirectToUserDetails()">
        <ion-label>{{ translate("View profile") }}</ion-label>
        <ion-icon :icon="personCircleOutline" />
      </ion-item>
      <ion-item button lines="none"  @click="logout()">
        <ion-label color="danger">{{ translate("Logout") }}</ion-label>
        <ion-icon :icon="exitOutline" color="danger"/>
      </ion-item>
    </ion-list>
  </ion-content>
</template>

<script lang="ts">
import {
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  popoverController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { translate } from "@common";
import { exitOutline, personCircleOutline } from 'ionicons/icons';
import { useAuthStore } from '@/store/auth';

export default defineComponent({
  name: "UserActionsPopover",
  components: {
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
  },
  methods: {
    redirectToUserDetails() {
      window.location.href = `${import.meta.env.VITE_VUE_APP_USERS_LOGIN_URL}?oms=${this.authStore.oms}&token=${this.authStore.token.value}&expirationTime=${this.authStore.token.expiration}&partyId=${this.authStore.current.partyId}`
      popoverController.dismiss()
    },
    async logout() {
      await this.authStore.logout()
      popoverController.dismiss()
    }
  },
  setup() {
    const authStore = useAuthStore();

    return {
      authStore,
      exitOutline,
      personCircleOutline,
      translate
    }
  }
});
</script>
