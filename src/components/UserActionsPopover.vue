<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ userStore.current?.userFullName?.trim() ? userStore.current.userFullName.trim() : userStore.current.username }}</ion-list-header>

      <ion-item button @click="redirectToUserDetails()">
        <ion-label>{{ translate("View profile") }}</ion-label>
        <ion-icon :icon="personCircleOutline" />
      </ion-item>
      <ion-item button lines="none" @click="logout()">
        <ion-label color="danger">
          {{ translate("Logout") }}
        </ion-label>
        <ion-icon :icon="exitOutline" color="danger" />
      </ion-item>
    </ion-list>
  </ion-content>
</template>

<script setup lang="ts">
import { commonUtil, cookieHelper, translate } from "@common";
import {
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  popoverController,
} from "@ionic/vue";
import { exitOutline, personCircleOutline } from "ionicons/icons";
import { useAuth } from "@/composables/auth";
import { useUserStore } from "@/store/user";

const userStore = useUserStore()

function redirectToUserDetails() {
  window.location.href = `${import.meta.env.VITE_USERS_LOGIN_URL}?oms=${commonUtil.getOmsURL()}&token=${cookieHelper().get("token")}&expirationTime=${cookieHelper().get("expirationTime")}&partyId=${userStore.current.partyId}`
  popoverController.dismiss()
}

async function logout() {
  await useAuth().logout()
  popoverController.dismiss()
}
</script>
