<template>
  <ion-page>
    <ion-content>
      <header>
        <h1 class="title">
          {{ $t('Launch Pad') }}
          <ion-icon color="danger" :icon="rocketOutline" />
        </h1>
        
        <ion-card v-if="authStore.isAuthenticated">
          <ion-list>
            <ion-item :lines="hasPermission(Actions.APP_COMMERCE_VIEW) ? 'full' : 'none'" button @click="openUserActionsPopover($event)">
              <ion-avatar slot="start">
                <Image :src="authStore.current?.partyImageUrl" />
              </ion-avatar>
              <ion-label class="ion-text-nowrap">
                <h2>{{ authStore.current?.partyName ? authStore.current?.partyName : authStore.current.userLoginId }}</h2>
              </ion-label>
              <ion-icon slot="end" :icon="chevronForwardOutline" class="ion-margin-start" />
            </ion-item>
            <ion-item v-if="hasPermission(Actions.APP_COMMERCE_VIEW)" lines="none" button @click="goToOms(authStore.token.value, authStore.getOMS)">
              <ion-icon slot="start" :icon="hardwareChipOutline"/>
              <ion-label>
                <h2>{{ authStore.getOMS }}</h2>
              </ion-label>
              <ion-icon slot="end" :icon="openOutline" class="ion-margin-start" />
            </ion-item>
          </ion-list>
        </ion-card>
        <ion-button v-else fill="outline" color="danger" @click="router.push('/login')">
          <ion-icon slot="start" :icon="personCircleOutline"/>
          {{ $t('Login') }}
        </ion-button>
      </header>
      <main>
        <div class="type" v-for="category in Object.keys(appCategory)" :key="category">
          <h3>{{ category }}</h3>
          <div class="apps">
            <ion-card button class="app" v-for="app in appCategory[category]" :key="app.handle" :disabled="authStore.isAuthenticated && isMaargLogin(app.handle) && !authStore.getMaargOms" @click.stop="generateAppLink(app)">
              <div class="app-icon ion-padding">
                <img :src="app.resource" />
              </div>
              <ion-card-header class="app-content">
                <ion-card-title color="text-medium">{{ app.name }}</ion-card-title>
                <ion-badge class="ion-margin" color="medium" v-if="authStore.isAuthenticated && isMaargLogin(app.handle) && !authStore.getMaargOms">
                  {{ translate("Not configured") }}
                </ion-badge>
                <ion-buttons class="app-links" v-else>
                  <!-- Disabled is added on the buttons only for the case when specific instance of the app support maarg login -->
                  <!-- This checks can be removed when all the app instance uses a single login flow either from ofbiz or from moqui -->
                  <ion-button color="medium" :disabled="authStore.isAuthenticated && isMaargLogin(app.handle, devHandle) && !authStore.getMaargOms" @click.stop="generateAppLink(app, devHandle)">
                    <ion-icon slot="icon-only" :icon="codeWorkingOutline" />
                  </ion-button>
                  <ion-button color="medium" :disabled="authStore.isAuthenticated && isMaargLogin(app.handle, uatHandle) && !authStore.getMaargOms" @click.stop="generateAppLink(app, uatHandle)">
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

<script lang="ts">
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
  popoverController
} from '@ionic/vue';
import { defineComponent, ref } from 'vue';
import {
  chevronForwardOutline,
  codeWorkingOutline,
  hardwareChipOutline,
  lockClosedOutline,
  openOutline,
  personCircleOutline,
  rocketOutline,
  shieldHalfOutline
} from 'ionicons/icons';
import { useAuthStore } from '@/store/auth';
import { useRouter } from "vue-router";
import { goToOms } from '@hotwax/dxp-components'
import { isMaargLogin, isOmsWithMaarg } from '@/util';
import { translate } from '@/i18n';
import UserActionsPopover from '@/components/UserActionsPopover.vue'
import Image from "@/components/Image.vue";
import { Actions, hasPermission } from '@/authorization'

export default defineComponent({
  name: 'Home',
  components: {
    Image,
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
    IonPage
  },
  ionViewDidEnter() {
    // clearing the redirect URL to break the login and redirection flow
    // if the user navigates to the home page while login
    this.authStore.setRedirectUrl('')
  },
  methods: {
    login() {
      // hydrate (pinia-plugin-persistedstate) will sync the app state with the
      // localStorage state for avoiding the case when two launchpad tabs are opened
      // and the user logs in through one and tries to login again from the next tab
      // $hydate will resync the state and hence, update the app UI
      this.authStore.$hydrate({ runHooks: false })
      // push to login only if user is not logged in (after state hydration)
      if (!this.authStore.isAuthenticated) {
        this.router.push('/login')
      }
    },
    async logout() {
      this.authStore.$hydrate({ runHooks: false })
      // hydrate and logout only if user is logged in (authenticated)
      if (this.authStore.isAuthenticated) {
        await this.authStore.logout()
      }
    },
    generateAppLink(app: any, appEnvironment = '') {
      const oms = isMaargLogin(app.handle, appEnvironment) ? this.authStore.getMaargOms : this.authStore.getOMS;
      window.location.href = this.scheme + app.handle + appEnvironment + this.domain + (this.authStore.isAuthenticated ? `/login?oms=${oms.startsWith('http') ? isMaargLogin(app.handle, appEnvironment) ? oms : oms.includes('/api') ? oms : `${oms}/api/` : oms}&token=${this.authStore.token.value}&expirationTime=${this.authStore.token.expiration}${isMaargLogin(app.handle, appEnvironment) ? '&omsRedirectionUrl=' + this.authStore.getOMS : isOmsWithMaarg(app.handle, appEnvironment) ? '&omsRedirectionUrl=' + this.authStore.getMaargOms : ''}` : '')
    },
    async openUserActionsPopover(event: any) {
      const userActionsPopover = await popoverController.create({
        component: UserActionsPopover,
        event,
        showBackdrop: false,
      });

      userActionsPopover.present();
    }
  },
  setup() {
    const authStore = useAuthStore();
    const router = useRouter();

    const appInfo = [{
      handle: 'bopis',
      name: 'BOPIS',
      resource: require('../assets/images/BOPIS.svg'),
      type: 'Orders'
    }, {
      handle: 'fulfillment',
      name: 'Fulfillment',
      resource: require('../assets/images/Fulfillment.svg'),
      type: 'Orders'
    }, {
      handle: 'preorder',
      name: 'Pre-Orders',
      resource: require('../assets/images/PreOrder.svg'),
      type: 'Orders'
    },  {
      handle: 'atp',
      name: 'Available to Promise',
      resource: require('../assets/images/Atp.svg'),
      type: 'Workflow'
    }, {
      handle: 'job-manager',
      name: 'Job Manager',
      resource: require('../assets/images/Job.svg'),
      type: 'Workflow'
    }, {
      handle: 'receiving',
      name: 'Receiving',
      resource: require('../assets/images/Receiving.svg'),
      type: 'Inventory'
    }, {
      handle: 'inventorycount',
      name: 'Cycle Count',
      resource: require('../assets/images/CycleCount.svg'),
      type: 'Inventory'
    }, {
      handle: 'picking',
      name: 'Picking',
      resource: require('../assets/images/Picking.svg'),
      type: 'Inventory'
    }, {
      handle: 'import',
      name: 'Import',
      resource: require('../assets/images/Import.svg'),
      type: 'Administration'
    }, {
      handle: 'users',
      name: 'Users',
      resource: require('../assets/images/UserManagement.svg'),
      type: 'Administration'
    }, {
      handle: 'facilities',
      name: 'Facilities',
      resource: require('../assets/images/Facilities.svg'),
      type: 'Administration'
    }, {
      handle: 'order-routing',
      name: 'Order Routing',
      resource: require('../assets/images/OrderRouting.svg'),
      type: 'Workflow'
    }, {
      handle: 'company',
      name: 'Company',
      resource: require('../assets/images/Company.svg'),
      type: 'Administration'
    }]

    const appCategory = appInfo.reduce((obj: any, app: any) => {
      if (obj[app.type]) {
        obj[app.type].push(app)
      } else {
        obj[app.type] = [app]
      }

      return obj
    }, {})

    const scheme = ref('https://')
    const domain = ref('.hotwax.io')
    const uatHandle = ref('-uat')
    const devHandle = ref('-dev')

    return {
      Actions,
      authStore,
      appCategory,
      chevronForwardOutline,
      codeWorkingOutline,
      devHandle,
      domain,
      goToOms,
      isMaargLogin,
      isOmsWithMaarg,
      lockClosedOutline,
      hardwareChipOutline,
      hasPermission,
      openOutline,
      personCircleOutline,
      rocketOutline,
      router,
      scheme,
      shieldHalfOutline,
      translate,
      uatHandle
    }
  }
});
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

