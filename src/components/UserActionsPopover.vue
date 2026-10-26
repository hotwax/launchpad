<template>
  <ion-content>
    <ion-list>
      <ion-list-header>{{ userStore.current?.userFullName?.trim() ? userStore.current.userFullName.trim() : userStore.current.username }}</ion-list-header>

      <ion-item button @click="redirectToUserDetails()" data-testid="view-profile-item">
        <ion-label>{{ translate("View profile") }}</ion-label>
        <ion-icon :icon="personCircleOutline" />
      </ion-item>
      <ion-item button lines="none" @click="logout()" data-testid="logout-item">
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

// The Users app is OFBiz only: a Moqui-only OMS shows the user in Company
function redirectToUserDetails() {
  const loginUrl = userStore.isMoquiOnly ? import.meta.env.VITE_COMPANY_LOGIN_URL : import.meta.env.VITE_USERS_LOGIN_URL
  // As main: the OMS exactly as entered, and the maarg as the other instance
  const oms = userStore.oms || cookieHelper().get("oms") || ""
  const maarg = commonUtil.getMaargBaseURL() || ""
  window.location.href = `${loginUrl}?oms=${oms}&token=${cookieHelper().get("token")}&expirationTime=${cookieHelper().get("expirationTime")}&partyId=${userStore.current.partyId}&omsRedirectionUrl=${maarg}`
  popoverController.dismiss()
}

async function logout() {
  await useAuth().logout()
  popoverController.dismiss()
}
</script>
