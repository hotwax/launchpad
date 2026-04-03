<template>
  <ion-page>
    <ion-content>
      <header>
        <h1 class="title">
          {{ translate('Launch Pad') }}
          <ion-icon color="danger" :icon="rocketOutline" />
        </h1>

        <ion-card v-if="isAuthenticated">
          <ion-list>
            <ion-item :lines="hasPermission('COMMERCEUSER_VIEW') ? 'full' : 'none'" button @click="openUserActionsPopover($event)">
              <ion-avatar slot="start">
                <Image :src="userStore.current?.partyImageUrl" />
              </ion-avatar>
              <ion-label class="ion-text-nowrap">
                <h2>{{ userStore.current?.userFullName?.trim() ? userStore.current.userFullName.trim() : userStore.current.username }}</h2>
              </ion-label>
              <ion-icon slot="end" :icon="chevronForwardOutline" class="ion-margin-start" />
            </ion-item>
            <ion-item v-if="hasPermission('COMMERCEUSER_VIEW')" lines="none" button @click="commonUtil.goToOms()">
              <ion-icon slot="start" :icon="hardwareChipOutline" />
              <ion-label>
                <h2>{{ cookieHelper().get("oms") }}</h2>
              </ion-label>
              <ion-icon slot="end" :icon="openOutline" class="ion-margin-start" />
            </ion-item>
          </ion-list>
        </ion-card>
        <ion-button v-else fill="outline" color="danger" @click="router.push('/login')">
          <ion-icon slot="start" :icon="personCircleOutline" />
          {{ translate('Login') }}
        </ion-button>
      </header>
      <main>
        <div v-for="category in Object.keys(appCategory)" :key="category" class="type">
          <h3>{{ category }}</h3>
          <div class="apps">
            <ion-card v-for="app in appCategory[category]" :key="app.handle" button class="app" @click.stop="generateAppLink(app)">
              <div class="app-icon ion-padding">
                <img :src="app.resource" />
              </div>
              <ion-card-header class="app-content">
                <ion-card-title color="text-medium">
                  {{ app.name }}
                </ion-card-title>

                <ion-buttons class="app-links">
                  <ion-button color="medium" @click.stop="generateAppLink(app, devHandle)">
                    <ion-icon slot="icon-only" :icon="codeWorkingOutline" />
                  </ion-button>
                  <ion-button color="medium" @click.stop="generateAppLink(app, uatHandle)">
                    <ion-icon slot="icon-only" :icon="shieldHalfOutline" />
                  </ion-button>
                </ion-buttons>
              </ion-card-header>
            </ion-card>
          </div>
        </div>
      </main>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { commonUtil, cookieHelper, translate } from "@common"
import {
  IonAvatar,
  IonButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  onIonViewDidEnter,
  popoverController
} from "@ionic/vue";
import {
  chevronForwardOutline,
  codeWorkingOutline,
  hardwareChipOutline,
  openOutline,
  personCircleOutline,
  rocketOutline,
  shieldHalfOutline
} from "ionicons/icons";
import { ref } from "vue";
import Image from "@/components/Image.vue";
import UserActionsPopover from "@/components/UserActionsPopover.vue"
import { useAuth } from "@/composables/auth";
import { useUserStore } from "@/store/user";
import { appInfo, isMaargLogin } from "@/util";
import router from "../router";

const userStore = useUserStore();
const { isAuthenticated } = useAuth();

const hasPermission = (permissionId: string) => userStore.hasPermission(permissionId)

const appCategory = appInfo.reduce((obj: any, app: any) => {
  if(obj[app.type]) {
    obj[app.type].push(app)
  } else {
    obj[app.type] = [app]
  }

  return obj
}, {})

const scheme = ref("https://")
const domain = ref(".hotwax.io")
const uatHandle = ref("-uat")
const devHandle = ref("-dev")

onIonViewDidEnter(() => {
  userStore.setRedirectUrl("")
})

function generateAppLink(app: any, appEnvironment = "") {
  let handle = app.handle
  // Below logic handles the redirection of user to legacy or new app version
  /*
  * Combinations when user to redirected to which app
  *
  * Legacy and New -> Legacy
  * Not Legacy and Not New -> Legacy
  * Legacy and Not New -> Legacy
  * Not Legacy and New -> New
  */
  if(hasPermission(app.appLegacyPermission) || !hasPermission(app.appPermission)) {
    handle = `${app.handle}-legacy`
  }
  const oms = isMaargLogin(handle, appEnvironment) ? commonUtil.getMaargBaseURL() : commonUtil.getOmsURL();
  const maarg = commonUtil.getMaargBaseURL()
  const omsRedirectionUrl = isMaargLogin(handle, appEnvironment) ? commonUtil.getOmsURL() : commonUtil.getMaargBaseURL();
  window.location.href = scheme.value + handle + appEnvironment + domain.value + (isAuthenticated.value ? `/login?oms=${oms}&token=${cookieHelper().get("token")}&expirationTime=${cookieHelper().get("expirationTime")}&maarg=${maarg}&omsRedirectionUrl=${omsRedirectionUrl}`: "")
}

async function openUserActionsPopover(event: any) {
  const userActionsPopover = await popoverController.create({
    component: UserActionsPopover,
    event,
    showBackdrop: false,
  });

  userActionsPopover.present();
}
</script>

<style>

  header {
    display: flex;
    justify-content: space-between;
    padding-inline: var(--spacer-lg);
    align-items: center;
    flex-wrap: wrap;
  }

  .title {
    font-size: clamp(0px, 11vw, 50px);
    font-weight: 700;
    padding-top: var(--spacer-lg);
    margin-bottom: var(--spacer-xl);
  }

  .title > ion-icon {
    position: relative;
    top: var(--spacer-xs);
  }

  .type {
    margin-bottom: 32px;
  }

  h3 {
    font-size: 26px;
    font-weight: 400;

  }

  .type > * {
    padding-left: var(--spacer-sm);
  }

  .apps {
    display: flex;
    overflow-x: auto;
    padding-block: var(--spacer-base);
  }

  .app {
    flex: 0 0 230px;
    border-radius: 40px;
    transition: .4s cubic-bezier(0.59, 0.08, 0.05, 1.4);
  }

  .app-icon {
    background-color: whitesmoke;
    width: inherit;
  }

  .app-icon > img {
    display: block;
    margin: auto;
    object-fit: cover;
  }

  ion-card-header {
    text-align: center;
    padding-bottom: 0;
    align-items: center;
  }

  ion-card-title {
    font-size: 16px;
    font-weight: 900;
  }

  .app-links {
    justify-content: center;
  }

  .card-disabled {
    opacity: 0.6;
  }

  @media only screen and (min-width: 768px) {
    .app:hover {
      box-shadow: rgb(0 0 0 / 26%) 0px 3px 17px -2px, rgb(0 0 0 / 14%) 0px 2px 6px 0px, rgb(0 0 0 / 12%) 0px 1px 12px 0px;
      transform: scale(1.05);
      /* alternate box shadow */
      /* box-shadow: 0px 24px 38px rgba(0, 0, 0, 0.14), 0px 9px 46px rgba(0, 0, 0, 0.12), 0px 11px 15px rgba(0, 0, 0, 0.2); */
      --logo-dropshadow: drop-shadow(0px 15px 3px rgb(0 0 0 / 0.4));
    }

    img {
      filter: var(--logo-dropshadow);
      transition: .4s cubic-bezier(0.59, 0.08, 0.05, 1.4);
    }

  }

  @media (prefers-color-scheme: dark) {
    .app-icon {
      background-color: #0f0f0f;
    }
  }

</style>
