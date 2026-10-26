<template>
  <ion-page>
    <ion-content>
      <header>
        <h1 class="title" data-testid="launchpad-title">
          {{ translate('Launch Pad') }}
          <ion-icon color="danger" :icon="rocketOutline" />
        </h1>

        <ion-card v-if="isAuthenticated">
          <ion-list>
            <ion-item :lines="hasPermission('COMMERCEUSER_VIEW') ? 'full' : 'none'" button @click="openUserActionsPopover($event)" data-testid="user-actions-item">
              <ion-avatar slot="start">
                <Image :src="userStore.current?.partyImageUrl" />
              </ion-avatar>
              <ion-label class="ion-text-nowrap">
                <h2>{{ userStore.current?.userFullName?.trim() ? userStore.current.userFullName.trim() : userStore.current.username }}</h2>
              </ion-label>
              <ion-icon slot="end" :icon="chevronForwardOutline" class="ion-margin-start" />
            </ion-item>
            <ion-item v-if="hasPermission('COMMERCEUSER_VIEW')" lines="none" button @click="commonUtil.goToOms()" data-testid="oms-item">
              <ion-icon slot="start" :icon="hardwareChipOutline" />
              <ion-label>
                <h2>{{ cookieHelper().get("oms") }}</h2>
              </ion-label>
              <ion-icon slot="end" :icon="openOutline" class="ion-margin-start" />
            </ion-item>
          </ion-list>
        </ion-card>
        <ion-button v-else fill="outline" color="danger" @click="router.push('/login')" data-testid="home-login-button">
          <ion-icon slot="start" :icon="personCircleOutline" />
          {{ translate('Login') }}
        </ion-button>
      </header>
      <main>
        <div class="type" v-for="(apps, category) in visibleAppCategory" :key="category">
          <h3>{{ category }}</h3>
          <div class="apps">
            <ion-card button class="app" v-for="app in apps" :key="app.handle" @click.stop="generateAppLink(app)" :data-testid="'app-card-' + app.handle">
              <div class="app-icon ion-padding">
                <img :src="app.resource" />
              </div>
              <ion-card-header class="app-content">
                <ion-card-title color="text-medium">{{ app.name }}</ion-card-title>
                <ion-badge class="ion-margin" color="medium" v-if="isAppBlocked(app)">
                  {{ translate("Not configured") }}
                </ion-badge>
                <ion-buttons class="app-links" v-else>
                  <ion-button color="medium" :disabled="isAuthenticated && isMaargLogin(app.handle, devHandle) && !commonUtil.getMaargBaseURL()" @click.stop="generateAppLink(app, devHandle)" :data-testid="'dev-button-' + app.handle">
                    <ion-icon slot="icon-only" :icon="codeWorkingOutline" />
                  </ion-button>
                  <ion-button color="medium" :disabled="isAuthenticated && isMaargLogin(app.handle, uatHandle) && !commonUtil.getMaargBaseURL()" @click.stop="generateAppLink(app, uatHandle)" :data-testid="'uat-button-' + app.handle">
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
  IonBadge,
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
} from "@ionic/vue"
import {
  chevronForwardOutline,
  codeWorkingOutline,
  hardwareChipOutline,
  openOutline,
  personCircleOutline,
  rocketOutline,
  shieldHalfOutline
} from "ionicons/icons"
import { computed } from "vue"
import Image from "@/components/Image.vue"
import UserActionsPopover from "@/components/UserActionsPopover.vue"
import { useAuth } from "@/composables/auth";
import { useUserStore } from "@/store/user";
import { appInfo, getOmsLinkParam, isMaargLogin, isOmsWithMaarg, toLocalAppUrl } from "@/util";
import router from "../router";

const userStore = useUserStore();
const { isAuthenticated } = useAuth();

const hasPermission = (permissionId: string) => userStore.hasPermission(permissionId)

function isAppBlocked(app: any) {
  if(!isAuthenticated.value) {
    return false
  }

  // Either the legacy or the new app permission opens the app, generateAppLink picks the version
  const hasLegacyPermission = app.appLegacyPermission ? hasPermission(app.appLegacyPermission) : false
  const hasNewPermission = app.appPermission ? hasPermission(app.appPermission) : false

  if((app.appLegacyPermission || app.appPermission) && !hasLegacyPermission && !hasNewPermission) {
    return true
  }

  if(isMaargLogin(app.handle) && !commonUtil.getMaargBaseURL()) {
    return true
  }

  return false
}

const appCategory = appInfo.reduce((obj: any, app: any) => {
  if(obj[app.type]) {
    obj[app.type].push(app)
  } else {
    obj[app.type] = [app]
  }

  return obj
}, {})

const visibleAppCategory = computed(() => {
  if (!isAuthenticated.value || !userStore.permissions?.length) {
    return appCategory
  }

  return Object.keys(appCategory).reduce((categories: any, category: string) => {
    const apps = appCategory[category].filter((app: any) => !isAppBlocked(app))
    if (apps.length) {
      categories[category] = apps
    }
    return categories
  }, {})
})

const scheme = "https://"
const domain = ".hotwax.io"
const uatHandle = "-uat"
const devHandle = "-dev"

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
  // Only an app with a legacy version falls back to it for a missing new permission
  if((app.appLegacyPermission && hasPermission(app.appLegacyPermission)) || (app.appLegacyPermission && app.appPermission && !hasPermission(app.appPermission))) {
    handle = `${app.handle}-legacy`
  }
  const maarg = commonUtil.getMaargBaseURL()
  const enteredOms = userStore.oms || cookieHelper().get("oms") || ""
  // A Moqui-only OMS has no OFBiz side: the instance is both the oms and the maarg for every app
  const oms = userStore.isMoquiOnly || isMaargLogin(handle, appEnvironment) ? maarg : getOmsLinkParam(enteredOms);
  // As main: the other instance only for the apps that use both
  const omsRedirectionUrl = isMaargLogin(handle, appEnvironment) ? enteredOms : isOmsWithMaarg(handle, appEnvironment) ? maarg : "";
  window.location.href = toLocalAppUrl(scheme + handle + appEnvironment + domain + (isAuthenticated.value ? `/login?oms=${oms}&token=${cookieHelper().get("token")}&expirationTime=${cookieHelper().get("expirationTime")}${omsRedirectionUrl ? `&omsRedirectionUrl=${omsRedirectionUrl}` : ""}`: ""))
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
